import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, enrollments, payments, user } from "@/lib/db/schema";
import { createInvoice, findOrCreateContact } from "@/server/alegra";
import { incrementCouponUsage, validateCoupon } from "@/server/coupons";
import { sendPaymentConfirmationEmail } from "@/server/email";

export interface PendingCheckout {
  invoice: string;
  amountCents: number;
  description: string;
}

/**
 * Crea (o reutiliza) matrículas pendientes para el usuario y una fila de pago por curso,
 * todas etiquetadas con el mismo `invoice` — así el webhook de ePayco, que solo conoce ese
 * invoice, puede marcar de una vez todo lo que corresponde a esa compra.
 *
 * Si se pasa `couponCodigo`, se revalida server-side (nunca confiar en el descuento que mandó
 * el cliente) y el descuento total se reparte proporcionalmente entre los cursos del carrito
 * según su precio, para que `payments.montoCents` de cada curso quede ya neto — es lo que se
 * cobra en ePayco y lo que se factura en Alegra, sin tener que recalcular el descuento en
 * ningún otro punto del flujo.
 */
export async function createPendingCheckout(
  userId: string,
  courseSlugs: string[],
  couponCodigo?: string,
): Promise<PendingCheckout> {
  if (courseSlugs.length === 0) throw new Error("El carrito está vacío");

  const rows = await db.query.courses.findMany({ where: inArray(courses.slug, courseSlugs) });
  if (rows.length !== courseSlugs.length) throw new Error("Algún curso del carrito ya no existe");

  const subtotalCents = rows.reduce((sum, c) => sum + c.precioCents, 0);

  let couponId: string | null = null;
  let totalDiscountCents = 0;
  if (couponCodigo) {
    const validation = await validateCoupon(couponCodigo, subtotalCents);
    if (!validation.ok || !validation.coupon || validation.discountCents === undefined) {
      throw new Error("El cupón ya no es válido");
    }
    couponId = validation.coupon.id;
    totalDiscountCents = validation.discountCents;
  }

  const invoice = randomUUID();
  let amountCents = 0;
  let discountRemaining = totalDiscountCents;

  await db.transaction(async (tx) => {
    for (const [i, course] of rows.entries()) {
      const existing = await tx.query.enrollments.findFirst({
        where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)),
      });

      const enrollment =
        existing ??
        (
          await tx
            .insert(enrollments)
            .values({ userId, courseId: course.id, estadoPago: "pendiente" })
            .returning()
        )[0];

      if (existing?.estadoPago === "pagado") continue; // ya lo compró, no se vuelve a cobrar

      // Reparto proporcional por precio; el último curso se lleva el resto para que la suma
      // cuadre exacto pese al redondeo de los anteriores.
      const isLast = i === rows.length - 1;
      const share =
        totalDiscountCents === 0
          ? 0
          : isLast
            ? discountRemaining
            : Math.round((course.precioCents / subtotalCents) * totalDiscountCents);
      discountRemaining -= share;

      const montoCents = course.precioCents - share;

      await tx.insert(payments).values({
        enrollmentId: enrollment.id,
        referenciaEpayco: invoice,
        montoCents,
        couponId,
        descuentoCents: share,
        estado: "pendiente",
      });

      amountCents += montoCents;
    }
  });

  if (amountCents === 0) throw new Error("Ya tienes todos estos cursos comprados");

  return {
    invoice,
    amountCents,
    description: rows.map((c) => c.titulo).join(", ").slice(0, 200),
  };
}

/**
 * Idempotente: si el invoice ya fue procesado (pagado), no hace nada de nuevo. Al marcar
 * "pagado" también intenta facturar en Alegra — si falla (ej. el estudiante no completó su
 * documento de identidad todavía), la matrícula queda pagada igual; la factura se puede generar
 * después. Nunca bloquear el acceso al curso por un problema de facturación.
 */
export async function confirmCheckout(invoice: string, estado: "pagado" | "fallido"): Promise<void> {
  const pendingPayments = await db.query.payments.findMany({
    where: and(eq(payments.referenciaEpayco, invoice), eq(payments.estado, "pendiente")),
  });
  if (pendingPayments.length === 0) return; // ya procesado o invoice desconocido

  await db.transaction(async (tx) => {
    for (const payment of pendingPayments) {
      await tx.update(payments).set({ estado }).where(eq(payments.id, payment.id));
      await tx
        .update(enrollments)
        .set({ estadoPago: estado })
        .where(eq(enrollments.id, payment.enrollmentId));
    }
  });

  if (estado !== "pagado") return;

  // Un cupón cuenta como "usado" una vez por checkout confirmado (no por curso ni por intento
  // abandonado) — todas las filas de pago de un mismo invoice comparten el mismo couponId.
  const couponId = pendingPayments.find((p) => p.couponId)?.couponId;
  if (couponId) await incrementCouponUsage(couponId);

  for (const payment of pendingPayments) {
    try {
      await invoicePayment(payment.id);
    } catch (err) {
      console.error(`No se pudo facturar el pago ${payment.id} en Alegra:`, err);
    }
  }

  await notifyPaymentConfirmed(pendingPayments);
}

async function notifyPaymentConfirmed(pendingPayments: (typeof payments.$inferSelect)[]): Promise<void> {
  const firstEnrollment = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, pendingPayments[0].enrollmentId),
  });
  if (!firstEnrollment) return;
  const buyer = await db.query.user.findFirst({ where: eq(user.id, firstEnrollment.userId) });
  if (!buyer) return;

  const courseIds = await Promise.all(
    pendingPayments.map(async (p) => {
      const enrollment = await db.query.enrollments.findFirst({ where: eq(enrollments.id, p.enrollmentId) });
      return enrollment?.courseId;
    }),
  );
  const courseRows = await db.query.courses.findMany({
    where: inArray(courses.id, courseIds.filter((id): id is string => !!id)),
  });
  const totalCents = pendingPayments.reduce((sum, p) => sum + p.montoCents, 0);

  sendPaymentConfirmationEmail(
    buyer.email,
    buyer.name,
    courseRows.map((c) => c.titulo),
    Math.round(totalCents / 100),
  ).catch((err) => console.error("No se pudo enviar el correo de confirmación de pago:", err));
}

async function invoicePayment(paymentId: string): Promise<void> {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, paymentId) });
  if (!payment) return;

  const enrollment = await db.query.enrollments.findFirst({ where: eq(enrollments.id, payment.enrollmentId) });
  if (!enrollment) return;

  const [buyer, course] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, enrollment.userId) }),
    db.query.courses.findFirst({ where: eq(courses.id, enrollment.courseId) }),
  ]);
  if (!buyer || !course) return;

  if (!buyer.identificationNumber || !buyer.identificationType) {
    throw new Error(`Usuario ${buyer.email} no tiene documento de identidad — completar en /cuenta`);
  }

  const contact = await findOrCreateContact({
    name: buyer.name,
    email: buyer.email,
    identification: buyer.identificationNumber,
    identificationType: buyer.identificationType as "CC" | "NIT" | "CE" | "PA",
  });

  const invoice = await createInvoice({
    contactId: contact.id,
    course: { titulo: course.titulo, duracionHoras: course.duracionHoras },
    precioTotal: Math.round(payment.montoCents / 100),
  });

  await db.update(payments).set({ facturaAlegraId: invoice.id }).where(eq(payments.id, payment.id));
}
