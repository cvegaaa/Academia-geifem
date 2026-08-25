import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessmentQuestions, assessments, courses, sections, units } from "@/lib/db/schema";
import { courses as mockCourses } from "@/lib/mock-data";

async function findOrCreateSection(nombre: string, orden: number): Promise<string> {
  const existing = await db.query.sections.findFirst({ where: eq(sections.nombre, nombre) });
  if (existing) return existing.id;
  const [row] = await db.insert(sections).values({ nombre, orden }).returning();
  return row.id;
}

async function seed() {
  console.log(`Sembrando ${mockCourses.length} cursos...`);

  const sectionIdByName = new Map<string, string>();
  let ordenSeccion = 0;
  for (const nombre of new Set(mockCourses.map((c) => c.seccionNombre))) {
    sectionIdByName.set(nombre, await findOrCreateSection(nombre, ordenSeccion++));
  }

  for (const course of mockCourses) {
    const [row] = await db
      .insert(courses)
      .values({
        slug: course.slug,
        titulo: course.titulo,
        sectionId: sectionIdByName.get(course.seccionNombre) ?? null,
        resumen: course.resumen,
        descripcion: course.descripcion,
        precioCents: course.precio * 100,
        duracionHoras: course.duracionHoras,
        categorias: course.categorias,
        estado: "publicado",
      })
      .onConflictDoNothing({ target: courses.slug })
      .returning();

    if (!row) {
      console.log(`  - ${course.titulo}: ya existía, se omite`);
      continue;
    }

    for (const unit of course.unidades) {
      const [unitRow] = await db
        .insert(units)
        .values({
          courseId: row.id,
          titulo: unit.titulo,
          orden: unit.orden,
          materialTitulo: unit.materialEscrito.titulo,
          materialContenido: unit.materialEscrito.resumen,
          videoRefuerzoTitulo: unit.videoRefuerzo.titulo,
          videoRefuerzoYoutubeId: unit.videoRefuerzo.youtubeId,
          videoRefuerzoDuracion: unit.videoRefuerzo.duracion,
          videoEjercicioTitulo: unit.videoEjercicio.titulo,
          videoEjercicioYoutubeId: unit.videoEjercicio.youtubeId,
          videoEjercicioDuracion: unit.videoEjercicio.duracion,
        })
        .returning();

      const [assessmentRow] = await db
        .insert(assessments)
        .values({ unitId: unitRow.id, titulo: unit.evaluacion.titulo })
        .returning();

      for (const [i, q] of unit.evaluacion.preguntas.entries()) {
        await db.insert(assessmentQuestions).values({
          assessmentId: assessmentRow.id,
          orden: i + 1,
          tipo: q.type,
          enunciado: q.enunciado,
          opciones: q.opciones,
          correctas: q.correctas,
        });
      }
    }

    console.log(`  + ${course.titulo}: ${course.unidades.length} unidades`);
  }

  console.log("Listo.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
