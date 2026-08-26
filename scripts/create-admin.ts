import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
const NAME = process.argv[4] ?? "Admin";
const ROLE = process.argv[5] ?? "admin";

const ROLES_VALIDOS = ["admin", "superadmin", "instructor"] as const;

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Uso: tsx scripts/create-admin.ts <email> <password> [nombre] [admin|superadmin|instructor]");
    process.exit(1);
  }
  if (!ROLES_VALIDOS.includes(ROLE as (typeof ROLES_VALIDOS)[number])) {
    console.error(`Rol inválido: ${ROLE}. Usar uno de: ${ROLES_VALIDOS.join(", ")}`);
    process.exit(1);
  }

  const existing = await db.query.user.findFirst({ where: eq(user.email, EMAIL) });
  if (existing) {
    await db.update(user).set({ role: ROLE }).where(eq(user.id, existing.id));
    console.log(`Usuario existente ${EMAIL} actualizado a role=${ROLE}.`);
    process.exit(0);
  }

  const result = await auth.api.signUpEmail({ body: { email: EMAIL, password: PASSWORD, name: NAME } });
  if (!result?.user) {
    console.error("No se pudo crear el usuario:", result);
    process.exit(1);
  }

  await db.update(user).set({ role: ROLE }).where(eq(user.id, result.user.id));
  console.log(`Usuario creado: ${EMAIL} (role=${ROLE}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
