import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCourseBySlug } from "@/server/courses";
import { getEnrollmentForUser, getProgressForEnrollment } from "@/server/progress";
import { StudentCourseView } from "@/components/student-course-view";

export default async function EstudianteCursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?next=/estudiante/${slug}`);

  const [found, course] = await Promise.all([
    getEnrollmentForUser(session.user.id, slug),
    getCourseBySlug(slug),
  ]);
  if (!found || !course) notFound(); // no compró este curso (o no existe) — no revelar cuál de las dos

  const progressMap = await getProgressForEnrollment(found.enrollment.id);
  const initialProgress = Object.fromEntries(
    Object.entries(progressMap).map(([unitId, p]) => [
      unitId,
      {
        material: p.materialVisto,
        refuerzo: p.videoRefuerzoVisto,
        ejercicio: p.videoEjercicioVisto,
        evaluacion: p.evaluacionAprobada,
      },
    ]),
  );

  return (
    <StudentCourseView course={course} courseSlug={slug} initialProgress={initialProgress} />
  );
}
