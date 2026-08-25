import Link from "next/link";
import { CheckCircle2, GraduationCap, XCircle } from "lucide-react";
import { Card } from "@/components/ui";
import { getCertificateByCode } from "@/server/progress";

export default async function VerificarPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const certificate = await getCertificateByCode(codigo.toUpperCase());

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={20} />
          </span>
          Academia
        </Link>

        <Card className="text-center">
          {certificate ? (
            <>
              <CheckCircle2 size={40} className="mx-auto text-brand-600" />
              <h1 className="mt-3 text-xl font-bold text-ink">Certificado válido</h1>
              <p className="mt-2 text-sm text-ink-soft">
                <strong>{certificate.estudianteNombre}</strong> completó el curso{" "}
                <strong>{certificate.cursoTitulo}</strong> el{" "}
                {certificate.fechaEmision.toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </p>
            </>
          ) : (
            <>
              <XCircle size={40} className="mx-auto text-red-500" />
              <h1 className="mt-3 text-xl font-bold text-ink">Código no encontrado</h1>
              <p className="mt-2 text-sm text-ink-soft">
                No existe ningún certificado con el código <strong>{codigo}</strong>. Verifica que
                lo hayas copiado correctamente.
              </p>
            </>
          )}
          <p className="mt-6 border-t border-border pt-4 text-xs text-ink-soft">
            Código verificado: {codigo.toUpperCase()}
          </p>
        </Card>
      </div>
    </div>
  );
}
