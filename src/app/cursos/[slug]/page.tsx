import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, PlayCircle, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CourseBuyButtons } from "@/components/course-buy-buttons";
import { Badge, Card } from "@/components/ui";
import { getCourseBySlug } from "@/server/courses";
import { formatCOP } from "@/lib/utils";

export default async function CursoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <div>
      <SiteHeader />

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[2fr_1fr]">
        <div>
          <Badge tone={course.seccionId ? "brand" : "neutral"}>{course.seccionNombre}</Badge>
          <h1 className="mt-3 text-3xl font-extrabold text-ink sm:text-4xl">{course.titulo}</h1>
          <p className="mt-4 text-lg text-ink-soft">{course.descripcion}</p>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-ink-soft">
            <span className="flex items-center gap-2">
              <Clock size={16} /> {course.duracionHoras} de contenido
            </span>
            <span className="flex items-center gap-2">
              <Users size={16} /> {course.estudiantes} estudiantes
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Certificado incluido
            </span>
          </div>

          <h2 className="mt-10 mb-4 text-xl font-bold text-ink">Contenido del curso</h2>
          <div className="space-y-3">
            {course.unidades.map((unit) => (
              <Card key={unit.id} className="p-4">
                <p className="text-xs font-semibold text-brand-600">Unidad {unit.orden}</p>
                <p className="mt-1 font-semibold text-ink">{unit.titulo}</p>
                <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-soft sm:grid-cols-4">
                  <li className="flex items-center gap-1.5">
                    <FileText size={14} /> Material
                  </li>
                  <li className="flex items-center gap-1.5">
                    <PlayCircle size={14} /> Video refuerzo
                  </li>
                  <li className="flex items-center gap-1.5">
                    <PlayCircle size={14} /> Video ejercicio
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Evaluación
                  </li>
                </ul>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="sticky top-6">
            <p className="text-3xl font-extrabold text-ink">{formatCOP(course.precio)}</p>
            <p className="mt-1 text-sm text-ink-soft">Pago único · acceso de por vida</p>
            <div className="mt-6">
              <CourseBuyButtons course={course} />
            </div>
            <p className="mt-3 text-center text-xs text-ink-soft">Pago seguro vía ePayco · PSE, tarjeta, Davivienda</p>
            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm text-ink-soft">
              <p>✓ {course.unidades.length} unidades, 100% práctico</p>
              <p>✓ Certificado descargable y verificable</p>
              <p>✓ Tu compra financia una beca GEIFEM</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
