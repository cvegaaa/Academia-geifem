import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons, courses, enrollments, payments, user } from "@/lib/db/schema";

export interface EnrollmentRow {
  id: string;
  estudianteNombre: string;
  estudianteEmail: string;
  cursoTitulo: string;
  estadoPago: string;
  porcentajeCompletado: number;
  fecha: Date;
}

export async function listEnrollmentsForAdmin(): Promise<EnrollmentRow[]> {
  const rows = await db
    .select({
      id: enrollments.id,
      estudianteNombre: user.name,
      estudianteEmail: user.email,
      cursoTitulo: courses.titulo,
      estadoPago: enrollments.estadoPago,
      porcentajeCompletado: enrollments.porcentajeCompletado,
      fecha: enrollments.createdAt,
    })
    .from(enrollments)
    .innerJoin(user, eq(enrollments.userId, user.id))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .orderBy(desc(enrollments.createdAt));
  return rows;
}

export interface PaymentRow {
  id: string;
  estudianteNombre: string;
  cursoTitulo: string;
  montoCents: number;
  descuentoCents: number;
  cuponCodigo: string | null;
  estado: string;
  facturaAlegraId: string | null;
  fecha: Date;
}

export async function listPaymentsForAdmin(): Promise<PaymentRow[]> {
  const rows = await db
    .select({
      id: payments.id,
      estudianteNombre: user.name,
      cursoTitulo: courses.titulo,
      montoCents: payments.montoCents,
      descuentoCents: payments.descuentoCents,
      cuponCodigo: coupons.codigo,
      estado: payments.estado,
      facturaAlegraId: payments.facturaAlegraId,
      fecha: payments.createdAt,
    })
    .from(payments)
    .innerJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
    .innerJoin(user, eq(enrollments.userId, user.id))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(coupons, eq(payments.couponId, coupons.id))
    .orderBy(desc(payments.createdAt));
  return rows.map((r) => ({ ...r, cuponCodigo: r.cuponCodigo ?? null }));
}

export interface ReportStats {
  matriculasPagadas: number;
  ingresosTotalesCents: number;
  topCursos: { titulo: string; ventas: number }[];
}

export async function getReportStats(): Promise<ReportStats> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.estadoPago, "pagado"));

  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.montoCents}), 0)` })
    .from(payments)
    .where(eq(payments.estado, "pagado"));

  const topCursos = await db
    .select({ titulo: courses.titulo, ventas: sql<number>`count(*)` })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.estadoPago, "pagado"))
    .groupBy(courses.titulo)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  return { matriculasPagadas: Number(count), ingresosTotalesCents: Number(total), topCursos };
}
