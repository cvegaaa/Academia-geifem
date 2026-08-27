import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessmentQuestions, assessments, courses, enrollments, sections, units } from "@/lib/db/schema";
import type { Course, Section, Unit } from "@/lib/types";

const SIN_SECCION = "Sin sección";

type UnitRow = typeof units.$inferSelect;
type AssessmentRow = typeof assessments.$inferSelect;
type QuestionRow = typeof assessmentQuestions.$inferSelect;
type CourseRow = typeof courses.$inferSelect;

function mapUnit(row: UnitRow, assessment: AssessmentRow | undefined, questions: QuestionRow[]): Unit {
  return {
    id: row.id,
    titulo: row.titulo,
    orden: row.orden,
    materialEscrito: {
      titulo: row.materialTitulo,
      resumen: row.materialContenido,
      archivoUrl: row.materialArchivoUrl,
      archivoNombre: row.materialArchivoNombre,
    },
    videoRefuerzo: {
      titulo: row.videoRefuerzoTitulo,
      youtubeId: row.videoRefuerzoYoutubeId,
      duracion: row.videoRefuerzoDuracion,
    },
    videoEjercicio: {
      titulo: row.videoEjercicioTitulo,
      youtubeId: row.videoEjercicioYoutubeId,
      duracion: row.videoEjercicioDuracion,
    },
    evaluacion: {
      titulo: assessment?.titulo ?? "Evaluación",
      preguntas: questions
        .sort((a, b) => a.orden - b.orden)
        .map((q) => ({
          id: q.id,
          type: q.tipo as Unit["evaluacion"]["preguntas"][number]["type"],
          enunciado: q.enunciado,
          opciones: q.opciones,
          correctas: q.correctas,
        })),
    },
  };
}

async function mapCourse(row: CourseRow, sectionNombreById: Map<string, string>): Promise<Course> {
  const unitRows = await db.query.units.findMany({
    where: eq(units.courseId, row.id),
    orderBy: [asc(units.orden)],
  });

  const unidades: Unit[] = [];
  for (const unitRow of unitRows) {
    const assessment = await db.query.assessments.findFirst({ where: eq(assessments.unitId, unitRow.id) });
    const questions = assessment
      ? await db.query.assessmentQuestions.findMany({ where: eq(assessmentQuestions.assessmentId, assessment.id) })
      : [];
    unidades.push(mapUnit(unitRow, assessment, questions));
  }

  return {
    slug: row.slug,
    titulo: row.titulo,
    seccionId: row.sectionId,
    seccionNombre: (row.sectionId && sectionNombreById.get(row.sectionId)) || SIN_SECCION,
    resumen: row.resumen,
    descripcion: row.descripcion,
    precio: Math.round(row.precioCents / 100),
    duracionHoras: row.duracionHoras,
    estudiantes: 0,
    categorias: row.categorias,
    unidades,
  };
}

async function sectionNameMap(): Promise<Map<string, string>> {
  const rows = await db.query.sections.findMany();
  return new Map(rows.map((s) => [s.id, s.nombre]));
}

/** Categorías distintas entre los cursos publicados — para los filtros del catálogo público. */
export async function getPublishedCategories(): Promise<string[]> {
  return distinctCategories(true);
}

/** Todas las categorías ya usadas (incluye borradores) — autocompletado en el admin. */
export async function getAllCategories(): Promise<string[]> {
  return distinctCategories(false);
}

async function distinctCategories(onlyPublished: boolean): Promise<string[]> {
  const rows = await db.query.courses.findMany({
    where: onlyPublished ? eq(courses.estado, "publicado") : undefined,
    columns: { categorias: true },
  });
  const set = new Set<string>();
  for (const row of rows) for (const c of row.categorias) set.add(c);
  return Array.from(set).sort();
}

// --- Secciones (agrupan cursos en el catálogo — editables desde el admin) -------------------

export async function listSections(): Promise<Section[]> {
  const rows = await db.query.sections.findMany({ orderBy: [asc(sections.orden)] });
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, orden: r.orden }));
}

export async function createSection(nombre: string): Promise<Section> {
  const existing = await db.query.sections.findMany();
  const orden = existing.length > 0 ? Math.max(...existing.map((s) => s.orden)) + 1 : 0;
  const [row] = await db.insert(sections).values({ nombre, orden }).returning();
  return { id: row.id, nombre: row.nombre, orden: row.orden };
}

export async function renameSection(id: string, nombre: string): Promise<void> {
  await db.update(sections).set({ nombre }).where(eq(sections.id, id));
}

/** Los cursos de la sección quedan sin sección (sectionId null) — nunca se borran cursos. */
export async function deleteSection(id: string): Promise<void> {
  await db.delete(sections).where(eq(sections.id, id));
}

export async function listCoursesForAdmin(): Promise<Course[]> {
  const rows = await db.query.courses.findMany({ orderBy: [asc(courses.createdAt)] });
  const names = await sectionNameMap();
  return Promise.all(rows.map((r) => mapCourse(r, names)));
}

export async function getPublishedCourses(): Promise<Course[]> {
  const rows = await db.query.courses.findMany({
    where: eq(courses.estado, "publicado"),
    orderBy: [asc(courses.createdAt)],
  });
  const names = await sectionNameMap();
  return Promise.all(rows.map((r) => mapCourse(r, names)));
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const row = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
  if (!row) return null;
  return mapCourse(row, await sectionNameMap());
}

/** Cursos pagados de un usuario — fuente real de "Mis cursos" en /cuenta. */
export async function getMyCourses(userId: string): Promise<Course[]> {
  const paid = await db.query.enrollments.findMany({
    where: and(eq(enrollments.userId, userId), eq(enrollments.estadoPago, "pagado")),
  });
  if (paid.length === 0) return [];
  const rows = await db.query.courses.findMany({
    where: inArray(courses.id, paid.map((p) => p.courseId)),
  });
  const names = await sectionNameMap();
  return Promise.all(rows.map((r) => mapCourse(r, names)));
}

export async function createDraftCourse(): Promise<Course> {
  const slug = `nuevo-curso-${Math.random().toString(36).slice(2, 8)}`;
  const firstSection = await db.query.sections.findFirst({ orderBy: [asc(sections.orden)] });
  const [row] = await db
    .insert(courses)
    .values({
      slug,
      titulo: "Nuevo curso",
      sectionId: firstSection?.id ?? null,
      precioCents: 30000 * 100,
      estado: "borrador",
    })
    .returning();
  return mapCourse(row, await sectionNameMap());
}

const MAX_HORAS_ETDH = 120; // tope regulatorio Colombia para formación no formal (ETDH)
const MIN_PRECIO_EPAYCO = 5000; // ePayco rechaza transacciones por debajo de $5.000 COP

export async function saveCourse(course: Course): Promise<void> {
  if (course.duracionHoras < 0 || course.duracionHoras > MAX_HORAS_ETDH) {
    throw new Error(
      `La duración debe estar entre 0 y ${MAX_HORAS_ETDH} horas — es el máximo permitido para ` +
        "formación no formal (ETDH) en Colombia.",
    );
  }
  if (course.precio > 0 && course.precio < MIN_PRECIO_EPAYCO) {
    throw new Error(
      `El precio debe ser de al menos $${MIN_PRECIO_EPAYCO.toLocaleString("es-CO")} COP — ePayco ` +
        "rechaza transacciones por debajo de ese monto.",
    );
  }

  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(courses)
      .set({
        titulo: course.titulo,
        sectionId: course.seccionId,
        resumen: course.resumen,
        descripcion: course.descripcion,
        precioCents: Math.round(course.precio * 100),
        duracionHoras: course.duracionHoras,
        categorias: course.categorias,
        // Sin flujo de borrador/publicación en el admin todavía — guardar publica. Si se agrega
        // un toggle de estado más adelante, quitar esta línea y respetar course.estado.
        estado: "publicado",
        updatedAt: new Date(),
      })
      .where(eq(courses.slug, course.slug))
      .returning();

    if (!row) throw new Error(`Curso no encontrado: ${course.slug}`);

    // Reemplazo completo de unidades/evaluaciones en cada guardado — más simple y confiable que
    // diffear id por id para un catálogo de este tamaño; el cascade de FKs limpia lo demás.
    await tx.delete(units).where(eq(units.courseId, row.id));

    for (const unit of course.unidades) {
      const [unitRow] = await tx
        .insert(units)
        .values({
          courseId: row.id,
          titulo: unit.titulo,
          orden: unit.orden,
          materialTitulo: unit.materialEscrito.titulo,
          materialContenido: unit.materialEscrito.resumen,
          materialArchivoUrl: unit.materialEscrito.archivoUrl ?? null,
          materialArchivoNombre: unit.materialEscrito.archivoNombre ?? null,
          videoRefuerzoTitulo: unit.videoRefuerzo.titulo,
          videoRefuerzoYoutubeId: unit.videoRefuerzo.youtubeId,
          videoRefuerzoDuracion: unit.videoRefuerzo.duracion,
          videoEjercicioTitulo: unit.videoEjercicio.titulo,
          videoEjercicioYoutubeId: unit.videoEjercicio.youtubeId,
          videoEjercicioDuracion: unit.videoEjercicio.duracion,
        })
        .returning();

      const [assessmentRow] = await tx
        .insert(assessments)
        .values({ unitId: unitRow.id, titulo: unit.evaluacion.titulo })
        .returning();

      for (const [i, q] of unit.evaluacion.preguntas.entries()) {
        await tx.insert(assessmentQuestions).values({
          assessmentId: assessmentRow.id,
          orden: i + 1,
          tipo: q.type,
          enunciado: q.enunciado,
          opciones: q.opciones,
          correctas: q.correctas,
        });
      }
    }
  });
}

export async function deleteCourse(slug: string): Promise<void> {
  await db.delete(courses).where(eq(courses.slug, slug));
}

export interface ContentStats {
  totalCursos: number;
  totalHoras: number;
  totalCategorias: number;
  totalUnidades: number;
}

/**
 * Estadísticas reales para la landing — del CONTENIDO del catálogo (cursos, horas, categorías,
 * unidades), nunca de graduados/estudiantes: no hay datos reales de eso todavía y presentar un
 * número inventado sería engañoso. Ver arquitectura-academia § Landing.
 */
export async function getContentStats(): Promise<ContentStats> {
  const rows = await db.query.courses.findMany({
    where: eq(courses.estado, "publicado"),
    columns: { id: true, duracionHoras: true, categorias: true },
  });

  const categoriasSet = new Set<string>();
  let totalHoras = 0;
  for (const row of rows) {
    for (const c of row.categorias) categoriasSet.add(c);
    totalHoras += row.duracionHoras;
  }

  const unitRows =
    rows.length > 0
      ? await db.query.units.findMany({
          where: inArray(
            units.courseId,
            rows.map((r) => r.id),
          ),
          columns: { id: true },
        })
      : [];

  return {
    totalCursos: rows.length,
    totalHoras,
    totalCategorias: categoriasSet.size,
    totalUnidades: unitRows.length,
  };
}
