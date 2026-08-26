"use server";

import { revalidatePath } from "next/cache";
import * as couponsData from "@/server/coupons";
import type { Coupon } from "@/server/coupons";
import { requireAdmin } from "@/server/actions/require-admin";

export async function createCouponAction(input: {
  codigo: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
  usosMaximos: number | null;
  fechaExpiracion: string | null;
}): Promise<Coupon> {
  await requireAdmin();
  const coupon = await couponsData.createCoupon(input);
  revalidatePath("/admin");
  return coupon;
}

export async function toggleCouponAction(id: string, activo: boolean): Promise<void> {
  await requireAdmin();
  await couponsData.toggleCoupon(id, activo);
  revalidatePath("/admin");
}

export async function deleteCouponAction(id: string): Promise<void> {
  await requireAdmin();
  await couponsData.deleteCoupon(id);
  revalidatePath("/admin");
}

export type PreviewCouponResult =
  | { ok: true; codigo: string; discountCents: number }
  | { ok: false; error: "not_found" | "inactive" | "expired" | "usage_limit_reached" };

/** Vista previa de solo lectura para el carrito — no reserva el cupón ni cuenta como uso. */
export async function previewCouponAction(codigo: string, subtotalCents: number): Promise<PreviewCouponResult> {
  const result = await couponsData.validateCoupon(codigo, subtotalCents);
  if (!result.ok || !result.coupon || result.discountCents === undefined) {
    return { ok: false, error: result.error ?? "not_found" };
  }
  return { ok: true, codigo: result.coupon.codigo, discountCents: result.discountCents };
}
