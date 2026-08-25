import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCertificateForEnrollment, getEnrollmentForUser } from "@/server/progress";
import { CertificateView } from "@/components/certificate-view";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui";

export default async function CertificadoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?next=/estudiante/${slug}/certificado`);

  const found = await getEnrollmentForUser(session.user.id, slug);
  if (!found) notFound();

  const certificate = await getCertificateForEnrollment(found.enrollment.id);
  if (!certificate) {
    return (
      <div>
        <SiteHeader />
        <section className="mx-auto max-w-md px-6 py-16 text-center">
          <Card>
            <p className="font-semibold text-ink">Todavía no has completado este curso</p>
            <p className="mt-2 text-sm text-ink-soft">
              El certificado se genera automáticamente al terminar todas las unidades.
            </p>
          </Card>
        </section>
      </div>
    );
  }

  return <CertificateView certificate={certificate} />;
}
