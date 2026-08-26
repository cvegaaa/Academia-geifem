import { asc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { env } from "@/lib/env";

export type StaffRole = "admin" | "superadmin" | "instructor";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: string;
}

function mapStaff(row: typeof user.$inferSelect): StaffUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as StaffRole,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Cuentas con privilegios (admin, superadmin, instructor) — nunca estudiantes, para no exponer todo el padrón aquí. */
export async function listStaffUsers(): Promise<StaffUser[]> {
  const rows = await db.query.user.findMany({ where: ne(user.role, "estudiante"), orderBy: [asc(user.name)] });
  return rows.map(mapStaff);
}

/**
 * Crea una cuenta con un rol privilegiado desde el panel admin. Deliberadamente NO usa
 * `auth.api.signUpEmail` directo — llamado desde una Server Action, el plugin `nextCookies()`
 * interceptaría el `Set-Cookie` de la respuesta y dejaría al admin que la creó logueado como el
 * usuario nuevo. En su lugar se hace un fetch server-to-server al endpoint HTTP de better-auth y
 * se ignora a propósito cualquier cookie de la respuesta — la sesión del admin actual no se toca.
 */
export async function createStaffUser(input: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}): Promise<StaffUser> {
  const res = await fetch(`${env.BETTER_AUTH_URL}/api/auth/sign-up/email`, {
    method: "POST",
    // better-auth valida el header Origin como protección CSRF — un fetch server-to-server no lo
    // manda por defecto, hay que fijarlo a mano igual a BETTER_AUTH_URL.
    headers: { "Content-Type": "application/json", Origin: env.BETTER_AUTH_URL },
    body: JSON.stringify({ email: input.email, password: input.password, name: input.name }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "No se pudo crear la cuenta");
  }
  const data = (await res.json()) as { user: { id: string } };

  const [row] = await db.update(user).set({ role: input.role }).where(eq(user.id, data.user.id)).returning();
  return mapStaff(row);
}

export async function deleteStaffUser(id: string): Promise<void> {
  await db.delete(user).where(eq(user.id, id));
}
