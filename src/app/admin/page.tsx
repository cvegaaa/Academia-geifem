import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllCategories, listCoursesForAdmin, listSections } from "@/server/courses";
import { getReportStats, listEnrollmentsForAdmin, listPaymentsForAdmin } from "@/server/admin";
import { listTestimonials } from "@/server/testimonials";
import { listCoupons } from "@/server/coupons";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== "admin") {
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
  ] = await Promise.all([
    listCoursesForAdmin(),
    getAllCategories(),
    listSections(),
    listEnrollmentsForAdmin(),
    listPaymentsForAdmin(),
    getReportStats(),
    listTestimonials(),
    listCoupons(),
  ]);

  return (
    <AdminShell
      initialCourses={initialCourses}
      allCategories={allCategories}
      initialSections={initialSections}
      userName={session.user.name}
      enrollments={enrollments}
      payments={paymentsRows}
      reportStats={reportStats}
      initialTestimonials={initialTestimonials}
      initialCoupons={initialCoupons}
    />
  );
}
