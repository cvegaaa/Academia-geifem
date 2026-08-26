import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Becas se administra solo por superadmin, a diferencia del resto del panel admin (admin + superadmin). */
export async function requireSuperadmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== "superadmin") {
    throw new Error("No autorizado — solo superadmin puede administrar becas");
  }
}
