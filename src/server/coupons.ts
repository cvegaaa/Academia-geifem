import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";

export interface Coupon {
  id: string;
  codigo: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
  activo: boolean;
  usosMaximos: number | null;
  usosActuales: number;
  fechaExpiracion: string | null;
}

function mapCoupon(row: typeof coupons.$inferSelect): Coupon {
  return {
    id: row.id,
    codigo: row.codigo,
    tipo: row.tipo as "porcentaje" | "fijo",
    valor: row.valor,
    activo: row.activo,
    usosMaximos: row.usosMaximos,
    usosActuales: row.usosActuales,
    fechaExpiracion: row.fechaExpiracion ? row.fechaExpiracion.toISOString() : null,
  };
}

export async function listCoupons(): Promise<Coupon[]> {
  const rows = await db.query.coupons.findMany({ orderBy: [desc(coupons.createdAt)] });
  return rows.map(mapCoupon);
}

export async function createCoupon(input: {
  codigo: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
  usosMaximos: number | null;
  fechaExpiracion: string | null;
}): Promise<Coupon> {
  const [row] = await db
    .insert(coupons)
    .values({
      codigo: input.codigo.trim().toUpperCase(),
      tipo: input.tipo,
      valor: input.valor,
      usosMaximos: input.usosMaximos,
      fechaExpiracion: input.fechaExpiracion ? new Date(input.fechaExpiracion) : null,
    })
    .returning();
  return mapCoupon(row);
}

export async function toggleCoupon(id: string, activo: boolean): Promise<void> {
  await db.update(coupons).set({ activo }).where(eq(coupons.id, id));
}

export async function deleteCoupon(id: string): Promise<void> {
  await db.delete(coupons).where(eq(coupons.id, id));
}

export interface CouponValidation {
  ok: boolean;
  error?: "not_found" | "inactive" | "expired" | "usage_limit_reached";
  coupon?: Coupon;
  discountCents?: number;
}

/** Validación pura, reutilizada tanto en la vista previa del carrito como al crear el checkout real. */
export async function validateCoupon(codigo: string, subtotalCents: number): Promise<CouponValidation> {
  const row = await db.query.coupons.findFirst({ where: eq(coupons.codigo, codigo.trim().toUpperCase()) });
  if (!row) return { ok: false, error: "not_found" };

  const coupon = mapCoupon(row);
  if (!coupon.activo) return { ok: false, error: "inactive" };
  if (coupon.fechaExpiracion && new Date(coupon.fechaExpiracion) < new Date()) {
    return { ok: false, error: "expired" };
  }
  if (coupon.usosMaximos !== null && coupon.usosActuales >= coupon.usosMaximos) {
    return { ok: false, error: "usage_limit_reached" };
  }

  const discountCents =
    coupon.tipo === "porcentaje"
      ? Math.round((subtotalCents * coupon.valor) / 100)
      : Math.min(coupon.valor, subtotalCents);

  return { ok: true, coupon, discountCents };
}

export async function incrementCouponUsage(id: string): Promise<void> {
  await db
    .update(coupons)
    .set({ usosActuales: sql`${coupons.usosActuales} + 1` })
    .where(eq(coupons.id, id));
}
