import { z } from "zod";

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  // URL pública de la app — better-auth la necesita para construir callbacks/redirects
  // correctamente en vez de derivarla del request (ambiguo detrás de un proxy/VPS).
  BETTER_AUTH_URL: z.string().min(1),
  // ePayco (checkout) — PUBLIC_KEY/PRIVATE_KEY autentican contra Apify para crear la sesión de
  // pago; P_CUST_ID_CLIENTE/P_KEY son un par distinto, solo para validar la firma (x_signature)
  // del webhook de confirmación. No confundir los dos pares — ver arquitectura-academia § Pagos.
  EPAYCO_PUBLIC_KEY: z.string().min(1),
  EPAYCO_PRIVATE_KEY: z.string().min(1),
  EPAYCO_P_CUST_ID_CLIENTE: z.string().min(1),
  EPAYCO_P_KEY: z.string().min(1),
  EPAYCO_TEST_MODE: z.enum(["true", "false"]).default("true"),
  // Alegra (facturación electrónica GEIFEM) — token JWT tipo "integration" generado desde el
  // panel de Alegra, va como Authorization: Bearer. Ver src/server/alegra.ts.
  ALEGRA_API_TOKEN: z.string().min(1),
  // "Curso Academia" (IVA 19%) y la resolución de facturación electrónica DIAN vigente de
  // GEIFEM — ver arquitectura-academia § Facturación electrónica para cómo se obtuvieron.
  ALEGRA_ITEM_ID_CURSO: z.string().min(1),
  ALEGRA_NUMBER_TEMPLATE_ID: z.string().min(1),
});

export function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new EnvValidationError(`Variables de entorno inválidas o ausentes: ${missing}`);
  }
  return result.data;
}

export const env = loadEnv();
