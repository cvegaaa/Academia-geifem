import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listStudentProgress } from "@/server/instructor";
import { InstructorDashboard } from "@/components/instructor-dashboard";

const ALLOWED_ROLES = ["instructor", "admin", "superadmin"];

export default async function InstructorPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || !role || !ALLOWED_ROLES.includes(role)) {
    redirect("/login?next=/instructor");
  }

  const rows = await listStudentProgress();

  return <InstructorDashboard rows={rows} userName={session.user.name} />;
}
