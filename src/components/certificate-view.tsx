import Image from "next/image";
import Link from "next/link";
import { Award, ShieldCheck } from "lucide-react";
import { DownloadCertificateButton } from "@/components/download-certificate-button";
import type { CertificateDetail } from "@/server/progress";

export function CertificateView({ certificate }: { certificate: CertificateDetail }) {
  const fecha = certificate.fechaEmision.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-surface-muted px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href="/cuenta" className="text-sm font-medium text-brand-700 hover:underline">
            ← Volver a mi cuenta
          </Link>
          <DownloadCertificateButton />
        </div>

        <div
          id="certificado"
          className="relative overflow-hidden rounded-3xl border-4 border-brand-100 bg-surface p-10 shadow-lg sm:p-14 print:border-0 print:shadow-none"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-100 print:hidden" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-50 print:hidden" />

          <div className="relative text-center">
            <Image src="/brand/logo.png" alt="GEIFEM Academy" width={56} height={56} className="mx-auto" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-ink-soft">GEIFEM Academy</p>

            <Award size={36} className="mx-auto mt-8 text-accent-500" />
            <h1 className="mt-3 text-3xl font-extrabold text-ink">Certificado de finalización</h1>
            <p className="mt-6 text-ink-soft">Se certifica que</p>
            <p className="mt-2 text-2xl font-bold text-brand-700">{certificate.estudianteNombre}</p>
            <p className="mt-4 text-ink-soft">completó satisfactoriamente el curso</p>
            <p className="mt-2 text-xl font-bold text-ink">{certificate.cursoTitulo}</p>
            <p className="mt-1 text-sm text-ink-soft">{certificate.cursoDuracionHoras} horas de contenido práctico</p>

            <p className="mt-8 text-sm text-ink-soft">Emitido el {fecha}</p>

            <div className="mx-auto mt-10 flex max-w-sm items-center justify-between border-t border-border pt-6 text-left">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft">Responsabilidad social</p>
                <p className="text-sm font-semibold text-ink">GEIFEM Consultoría</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft">Desarrollado por</p>
                <p className="text-sm font-semibold text-ink">Vegora</p>
              </div>
            </div>

            <p className="mt-6 text-xs text-ink-soft">Código de verificación: {certificate.codigoVerificacion}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-soft print:hidden">
          <ShieldCheck size={16} className="text-brand-600" />
          Verificable en{" "}
          <Link href={`/verificar/${certificate.codigoVerificacion}`} className="font-semibold text-brand-700 hover:underline">
            academia.geifem.com/verificar/{certificate.codigoVerificacion}
          </Link>
        </div>
      </div>
    </div>
  );
}
