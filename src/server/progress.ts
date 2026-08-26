import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, courses, enrollments, progress, units, user } from "@/lib/db/schema";
import { sendCertificateReadyEmail } from "@/server/email";

export type StepKey = "material" | "refuerzo" | "ejercicio" | "evaluacion";

type ProgressRow = typeof progress.$inferSelect;

export async function getEnrollmentForUser(userId: string, courseSlug: string) {
  const course = await db.query.courses.findFirst({ where: eq(courses.slug, courseSlug) });
  if (!course) return null;
  const enrollment = await db.query.enrollments.findFirst({
    where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)),
  });
  if (!enrollment || enrollment.estadoPago !== "pagado") return null;
  return { enrollment, course };
}

export async function getProgressForEnrollment(enrollmentId: string): Promise<Record<string, ProgressRow>> {
  const rows = await db.query.progress.findMany({ where: eq(progress.enrollmentId, enrollmentId) });
  return Object.fromEntries(rows.map((r) => [r.unitId, r]));
}

function isUnitComplete(row: ProgressRow | undefined): boolean {
  return !!row && row.materialVisto && row.videoRefuerzoVisto && row.videoEjercicioVisto && row.evaluacionAprobada;
}

/** Marca un paso y, si con eso el curso queda 100% completo, emite el certificado. */
export async function markStep(
  enrollmentId: string,
  unitId: string,
  step: StepKey,
  options?: { puntaje?: number; aprobado?: boolean },
): Promise<{ courseComplete: boolean; certificateCode: string | null }> {
  const patch: Partial<ProgressRow> = {};
  if (step === "material") patch.materialVisto = true;
  if (step === "refuerzo") patch.videoRefuerzoVisto = true;
  if (step === "ejercicio") patch.videoEjercicioVisto = true;
  if (step === "evaluacion") {
    // Si no aprueba, se guarda el intento (puntaje) pero NO se marca aprobada — el estudiante
    // no avanza de unidad hasta pasarla. Ver arquitectura-academia § Evaluaciones.
    patch.evaluacionAprobada = options?.aprobado ?? false;
    if (options?.puntaje !== undefined) patch.puntaje = options.puntaje;
  }

  const existing = await db.query.progress.findFirst({
    where: and(eq(progress.enrollmentId, enrollmentId), eq(progress.unitId, unitId)),
  });

  if (existing) {
    await db.update(progress).set(patch).where(eq(progress.id, existing.id));
  } else {
    await db.insert(progress).values({ enrollmentId, unitId, ...patch });
  }

  const enrollment = await db.query.enrollments.findFirst({ where: eq(enrollments.id, enrollmentId) });
  if (!enrollment) return { courseComplete: false, certificateCode: null };

  const courseUnits = await db.query.units.findMany({ where: eq(units.courseId, enrollment.courseId) });
  const allProgress = await getProgressForEnrollment(enrollmentId);
  const courseComplete = courseUnits.length > 0 && courseUnits.every((u) => isUnitComplete(allProgress[u.id]));

  if (!courseComplete) return { courseComplete: false, certificateCode: null };

  await db.update(enrollments).set({ porcentajeCompletado: 100 }).where(eq(enrollments.id, enrollmentId));
  const certificateCode = await issueCertificateIfMissing(enrollmentId);
  return { courseComplete: true, certificateCode };
}

function generateCode(): string {
  return `ACAD-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function issueCertificateIfMissing(enrollmentId: string): Promise<string> {
  const existing = await db.query.certificates.findFirst({ where: eq(certificates.enrollmentId, enrollmentId) });
  if (existing) return existing.codigoVerificacion;

  const codigoVerificacion = generateCode();
  const [row] = await db.insert(certificates).values({ enrollmentId, codigoVerificacion }).returning();

  const enrollment = await db.query.enrollments.findFirst({ where: eq(enrollments.id, enrollmentId) });
  if (enrollment) {
    const [buyer, course] = await Promise.all([
      db.query.user.findFirst({ where: eq(user.id, enrollment.userId) }),
      db.query.courses.findFirst({ where: eq(courses.id, enrollment.courseId) }),
    ]);
    if (buyer && course) {
      sendCertificateReadyEmail(buyer.email, buyer.name, course.titulo, row.codigoVerificacion).catch((err) =>
        console.error("No se pudo enviar el correo de certificado listo:", err),
      );
    }
  }

  return row.codigoVerificacion;
}

export interface CertificateDetail {
  codigoVerificacion: string;
  fechaEmision: Date;
  estudianteNombre: string;
  cursoTitulo: string;
  cursoDuracionHoras: number;
}

export async function getCertificateForEnrollment(enrollmentId: string): Promise<CertificateDetail | null> {
  const cert = await db.query.certificates.findFirst({ where: eq(certificates.enrollmentId, enrollmentId) });
  if (!cert) return null;
  return hydrateCertificate(cert.codigoVerificacion, cert.fechaEmision, enrollmentId);
}

export async function getCertificateByCode(codigo: string): Promise<CertificateDetail | null> {
  const cert = await db.query.certificates.findFirst({ where: eq(certificates.codigoVerificacion, codigo) });
  if (!cert) return null;
  return hydrateCertificate(cert.codigoVerificacion, cert.fechaEmision, cert.enrollmentId);
}

async function hydrateCertificate(
  codigoVerificacion: string,
  fechaEmision: Date,
  enrollmentId: string,
): Promise<CertificateDetail | null> {
  const enrollment = await db.query.enrollments.findFirst({ where: eq(enrollments.id, enrollmentId) });
  if (!enrollment) return null;
  const [buyer, course] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, enrollment.userId) }),
    db.query.courses.findFirst({ where: eq(courses.id, enrollment.courseId) }),
  ]);
  if (!buyer || !course) return null;

  return {
    codigoVerificacion,
    fechaEmision,
    estudianteNombre: buyer.name,
    cursoTitulo: course.titulo,
    cursoDuracionHoras: course.duracionHoras,
  };
}
