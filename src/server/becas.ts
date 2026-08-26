import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, scholarships } from "@/lib/db/schema";

// % de matrículas pagas que se destina a cupos becados — Fase 0-1 del plan (escala a 10% en
// fase 2). Ver arquitectura-academia § Becas GEIFEM.
const BECAS_PCT = 0.05;

export interface Beca {
  id: string;
  beneficiarioNombre: string;
  criterio: string;
  fechaAsignacion: string;
}

export interface BecasStats {
  matriculasPagas: number;
  becasOtorgadas: number;
  cupoDisponible: number;
}

export async function listBecas(): Promise<Beca[]> {
  const rows = await db.query.scholarships.findMany({ orderBy: [desc(scholarships.fechaAsignacion)] });
  return rows.map((r) => ({
    id: r.id,
    beneficiarioNombre: r.beneficiarioNombre,
    criterio: r.criterio,
    fechaAsignacion: r.fechaAsignacion.toISOString(),
  }));
}

/** Contador público real — nada de esto es mock. Cupo disponible = % de matrículas pagas menos las ya otorgadas. */
export async function getBecasStats(): Promise<BecasStats> {
  const [pagadas, becas] = await Promise.all([
    db.query.payments.findMany({ where: eq(payments.estado, "pagado"), columns: { id: true } }),
    db.query.scholarships.findMany({ columns: { id: true } }),
  ]);
  const matriculasPagas = pagadas.length;
  const becasOtorgadas = becas.length;
  const cupoDisponible = Math.max(0, Math.floor(matriculasPagas * BECAS_PCT) - becasOtorgadas);
  return { matriculasPagas, becasOtorgadas, cupoDisponible };
}

export async function createBeca(input: { beneficiarioNombre: string; criterio: string }): Promise<Beca> {
  const [row] = await db.insert(scholarships).values(input).returning();
  return {
    id: row.id,
    beneficiarioNombre: row.beneficiarioNombre,
    criterio: row.criterio,
    fechaAsignacion: row.fechaAsignacion.toISOString(),
  };
}

export async function deleteBeca(id: string): Promise<void> {
  await db.delete(scholarships).where(eq(scholarships.id, id));
}
