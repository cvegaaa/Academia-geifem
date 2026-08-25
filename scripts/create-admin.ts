import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
const NAME = process.argv[4] ?? "Superadmin";

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Uso: tsx scripts/create-admin.ts <email> <password> [nombre]");
    process.exit(1);
  }

  const existing = await db.query.user.findFirst({ where: eq(user.email, EMAIL) });
  if (existing) {
    await db.update(user).set({ role: "admin" }).where(eq(user.id, existing.id));
    console.log(`Usuario existente ${EMAIL} actualizado a role=admin.`);
    process.exit(0);
  }

  const result = await auth.api.signUpEmail({ body: { email: EMAIL, password: PASSWORD, name: NAME } });
  if (!result?.user) {
    console.error("No se pudo crear el usuario:", result);
    process.exit(1);
  }

  await db.update(user).set({ role: "admin" }).where(eq(user.id, result.user.id));
  console.log(`Superadmin creado: ${EMAIL} (role=admin).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
