import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Repite la verificación de /admin/page.tsx dentro de la Server Action — esta es alcanzable por su ID sin pasar por la página. */
export async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role !== "admin" && role !== "superadmin")) {
    throw new Error("No autorizado");
  }
}
