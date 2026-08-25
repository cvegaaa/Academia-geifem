import { NextResponse } from "next/server";
import { confirmCheckout } from "@/server/checkout";
import { verifyWebhookSignature } from "@/server/epayco";

// ePayco reintenta el webhook varias veces — confirmCheckout es idempotente (no reprocesa un
// invoice que ya quedó "pagado"). Ver arquitectura-academia § Pagos y .claude/rules/api-routes.md
// de geifem-agentes (mismo criterio: verificar firma antes de confiar en el body).
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const raw: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const body = await request.json();
    for (const [k, v] of Object.entries(body)) raw[k] = String(v);
  } else {
    const form = await request.formData();
    for (const [k, v] of form.entries()) raw[k] = String(v);
  }

  const { x_ref_payco, x_transaction_id, x_amount, x_currency_code, x_signature, x_id_factura, x_transaction_state } =
    raw;

  if (!x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code || !x_signature || !x_id_factura) {
    return NextResponse.json({ ok: false, error: { code: "missing_fields", message: "Faltan campos" } }, { status: 400 });
  }

  const valid = verifyWebhookSignature({ x_ref_payco, x_transaction_id, x_amount, x_currency_code, x_signature });
  if (!valid) {
    return NextResponse.json({ ok: false, error: { code: "invalid_signature", message: "Firma inválida" } }, { status: 400 });
  }

  if (x_transaction_state === "Aceptada") {
    await confirmCheckout(x_id_factura, "pagado");
  } else if (x_transaction_state === "Rechazada" || x_transaction_state === "Fallida") {
    await confirmCheckout(x_id_factura, "fallido");
  }
  // Otros estados (Pendiente, Iniciada): no se toca, ePayco reintenta hasta resolver.

  return NextResponse.json({ ok: true });
}
