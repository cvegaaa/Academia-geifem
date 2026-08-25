"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { createPendingCheckout } from "@/server/checkout";
import { createCheckoutSession } from "@/server/epayco";

export type StartCheckoutResult =
  | { ok: true; sessionId: string; testMode: boolean }
  | { ok: false; error: "not_authenticated" | "missing_identification" | string };

export async function startCheckoutAction(
  courseSlugs: string[],
  couponCodigo?: string,
): Promise<StartCheckoutResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "not_authenticated" };

  const buyer = session.user as unknown as { identificationNumber?: string | null };
  if (!buyer.identificationNumber) return { ok: false, error: "missing_identification" };

  try {
    const pending = await createPendingCheckout(session.user.id, courseSlugs, couponCodigo);
    const sessionId = await createCheckoutSession({
      invoice: pending.invoice,
      amount: Math.round(pending.amountCents / 100),
      description: pending.description || "Cursos Academia",
      email: session.user.email,
      name: session.user.name,
      confirmationUrl: `${env.BETTER_AUTH_URL}/api/webhooks/epayco`,
      responseUrl: `${env.BETTER_AUTH_URL}/carrito/confirmacion`,
    });
    return { ok: true, sessionId, testMode: env.EPAYCO_TEST_MODE === "true" };
  } catch (err) {
    console.error("startCheckoutAction falló:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown_error" };
  }
}
