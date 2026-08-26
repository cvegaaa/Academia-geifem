import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllCategories, listCoursesForAdmin, listSections } from "@/server/courses";
import { getReportStats, listEnrollmentsForAdmin, listPaymentsForAdmin } from "@/server/admin";
import { listTestimonials } from "@/server/testimonials";
import { listCoupons } from "@/server/coupons";
import { listStaffUsers } from "@/server/users";
import { getBecasStats, listBecas } from "@/server/becas";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role !== "admin" && role !== "superadmin")) {
    redirect("/admin/login");
  }

  const [
    initialCourses,
    allCategories,
    initialSections,
    enrollments,
    paymentsRows,
    reportStats,
    initialTestimonials,
    initialCoupons,
    initialStaff,
  ] = await Promise.all([
    listCoursesForAdmin(),
    getAllCategories(),
    listSections(),
    listEnrollmentsForAdmin(),
    listPaymentsForAdmin(),
    getReportStats(),
    listTestimonials(),
    listCoupons(),
    listStaffUsers(),
  ]);

  // Becas es exclusivo de superadmin — ni siquiera se consulta la DB si el rol no califica.
  const [initialBecas, becasStats] =
    role === "superadmin" ? await Promise.all([listBecas(), getBecasStats()]) : [[], null];

  return (
    <AdminShell
      initialCourses={initialCourses}
      allCategories={allCategories}
      initialSections={initialSections}
      userId={session.user.id}
      userName={session.user.name}
      userRole={role ?? "admin"}
      enrollments={enrollments}
      payments={paymentsRows}
      reportStats={reportStats}
      initialTestimonials={initialTestimonials}
      initialCoupons={initialCoupons}
      initialStaff={initialStaff}
      initialBecas={initialBecas}
      becasStats={becasStats}
    />
  );
}
