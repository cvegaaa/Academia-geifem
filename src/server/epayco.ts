import { createHash } from "node:crypto";
import { env } from "@/lib/env";

const APIFY_BASE = "https://apify.epayco.co";

interface CheckoutSessionInput {
  invoice: string;
  amount: number; // pesos, no centavos — ver arquitectura-academia § Pagos
  description: string;
  email: string;
  name: string;
  confirmationUrl: string;
  responseUrl: string;
}

async function getAccessToken(): Promise<string> {
  const basic = Buffer.from(`${env.EPAYCO_PUBLIC_KEY}:${env.EPAYCO_PRIVATE_KEY}`).toString("base64");
  const res = await fetch(`${APIFY_BASE}/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`ePayco login falló: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function createCheckoutSession(input: CheckoutSessionInput): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${APIFY_BASE}/payment/session/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      checkout_version: "2",
      name: "GEIFEM Academy",
      description: input.description,
      currency: "COP",
      amount: input.amount,
      country: "CO",
      lang: "ES",
      invoice: input.invoice,
      response: input.responseUrl,
      confirmation: input.confirmationUrl,
      methodConfirmation: "POST",
      billing: { email: input.email, name: input.name },
    }),
  });
  if (!res.ok) throw new Error(`ePayco session/create falló: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { success: boolean; data?: { sessionId: string } };
  if (!data.success || !data.data?.sessionId) throw new Error(`ePayco no devolvió sessionId: ${JSON.stringify(data)}`);
  return data.data.sessionId;
}

export function verifyWebhookSignature(fields: {
  x_ref_payco: string;
  x_transaction_id: string;
  x_amount: string;
  x_currency_code: string;
  x_signature: string;
}): boolean {
  const toHash = [
    env.EPAYCO_P_CUST_ID_CLIENTE,
    env.EPAYCO_P_KEY,
    fields.x_ref_payco,
    fields.x_transaction_id,
    fields.x_amount,
    fields.x_currency_code,
  ].join("^");
  const expected = createHash("sha256").update(toHash).digest("hex");
  return expected === fields.x_signature;
}
