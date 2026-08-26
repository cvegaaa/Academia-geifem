import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, enrollments, progress, units, user } from "@/lib/db/schema";

export interface UnitProgressDetail {
  unitId: string;
  titulo: string;
  orden: number;
  materialVisto: boolean;
  videoRefuerzoVisto: boolean;
  videoEjercicioVisto: boolean;
  evaluacionAprobada: boolean;
  puntaje: number | null;
}

export interface StudentProgressRow {
  enrollmentId: string;
  estudianteNombre: string;
  estudianteEmail: string;
  cursoTitulo: string;
  porcentajeCompletado: number;
  fecha: Date;
  unidades: UnitProgressDetail[];
}

/**
 * Vista de solo lectura para el rol instructor (y admin/superadmin): progreso y resultados de
 * evaluación de cada estudiante matriculado y pagado — sin acceso a pagos, cupones ni becas,
 * que quedan solo en /admin. Ver arquitectura-academia § Roles.
 */
export async function listStudentProgress(): Promise<StudentProgressRow[]> {
  const paidEnrollments = await db
    .select({
      enrollmentId: enrollments.id,
      courseId: enrollments.courseId,
      porcentajeCompletado: enrollments.porcentajeCompletado,
      fecha: enrollments.createdAt,
      estudianteNombre: user.name,
      estudianteEmail: user.email,
      cursoTitulo: courses.titulo,
    })
    .from(enrollments)
    .innerJoin(user, eq(enrollments.userId, user.id))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.estadoPago, "pagado"))
    .orderBy(desc(enrollments.createdAt));

  const rows: StudentProgressRow[] = [];
  for (const e of paidEnrollments) {
    const courseUnits = await db.query.units.findMany({
      where: eq(units.courseId, e.courseId),
      orderBy: [asc(units.orden)],
    });
    const progressRows = await db.query.progress.findMany({
      where: eq(progress.enrollmentId, e.enrollmentId),
    });
    const progressByUnit = new Map(progressRows.map((p) => [p.unitId, p]));

    rows.push({
      enrollmentId: e.enrollmentId,
      estudianteNombre: e.estudianteNombre,
      estudianteEmail: e.estudianteEmail,
      cursoTitulo: e.cursoTitulo,
      porcentajeCompletado: e.porcentajeCompletado,
      fecha: e.fecha,
      unidades: courseUnits.map((u) => {
        const p = progressByUnit.get(u.id);
        return {
          unitId: u.id,
          titulo: u.titulo,
          orden: u.orden,
          materialVisto: p?.materialVisto ?? false,
          videoRefuerzoVisto: p?.videoRefuerzoVisto ?? false,
          videoEjercicioVisto: p?.videoEjercicioVisto ?? false,
          evaluacionAprobada: p?.evaluacionAprobada ?? false,
          puntaje: p?.puntaje ?? null,
        };
      }),
    });
  }
  return rows;
}
