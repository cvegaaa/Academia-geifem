import Link from "next/link";
import { Award, BookOpen, Clock, CreditCard, Heart, Search, Sparkles, Tag, Layers } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CatalogBrowser } from "@/components/catalog-browser";
import { HeroVisual } from "@/components/hero-visual";
import { ScrollReveal, StaggerGroup, StaggerItem } from "@/components/scroll-reveal";
import { AnimatedCounter } from "@/components/animated-counter";
import { FaqAccordion } from "@/components/faq-accordion";
import { TestimonialsSection } from "@/components/testimonials-section";
import { Badge, Button, Card } from "@/components/ui";
import { getContentStats, getPublishedCategories, getPublishedCourses, listSections } from "@/server/courses";
import { listTestimonials } from "@/server/testimonials";
import { getBecasStats } from "@/server/becas";
import { formatCOP } from "@/lib/utils";

const VALOR_PROPUESTA = [
  {
    icon: Clock,
    titulo: "100% práctico",
    texto: "Ejercicios reales que puedes aplicar de inmediato en tu trabajo, no solo teoría.",
  },
  {
    icon: Tag,
    titulo: "Precio accesible",
    texto: "Formación de calidad a un precio justo, sin las barreras de una carrera tradicional.",
  },
  {
    icon: Award,
    titulo: "Certificable",
    texto: "Certificado descargable y verificable, listo para tu hoja de vida o LinkedIn.",
  },
  {
    icon: Heart,
    titulo: "Con propósito",
    texto: "Cada matrícula paga sostiene, además, un cupo becado para quien no puede pagar.",
  },
];

const COMO_FUNCIONA = [
  { icon: Search, titulo: "Elige tu curso", texto: "Explora el catálogo y encuentra el que necesitas." },
  { icon: CreditCard, titulo: "Paga seguro", texto: "PSE, tarjeta o Davivienda, vía ePayco." },
  { icon: Clock, titulo: "Aprende a tu ritmo", texto: "Accede al instante, avanza cuando puedas." },
  { icon: Award, titulo: "Certifícate", texto: "Termina las unidades y descarga tu certificado." },
];

export default async function CatalogoPage() {
  const [courses, categories, sections, stats, testimonials, becasStats] = await Promise.all([
    getPublishedCourses(),
    getPublishedCategories(),
    listSections(),
    getContentStats(),
    listTestimonials(),
    getBecasStats(),
  ]);

  const bundleSection = sections[0];
  const bundleCourses = bundleSection ? courses.filter((c) => c.seccionId === bundleSection.id) : [];
  const bundlePrecio = bundleCourses.reduce((sum, c) => sum + c.precio, 0);

  const stats_ = [
    { icon: BookOpen, value: stats.totalCursos, label: "cursos disponibles" },
    { icon: Layers, value: stats.totalUnidades, label: "unidades de aprendizaje" },
    { icon: Tag, value: stats.totalCategorias, label: "categorías" },
  ];

  return (
    <div>
      <SiteHeader />

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[3fr_2fr]">
        <div className="max-w-2xl">
          <Badge tone="accent">Cursos 100% online · Certificado incluido</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Cursos online de ofimática y habilidades laborales
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            Aprende Excel, Word y las habilidades que hoy piden las empresas en cursos 100%
            prácticos, con certificado digital verificable — a tu ritmo, sin importar tu edad o
            experiencia previa. Cada matrícula paga sostiene además un cupo becado para quien no
            puede pagar — la política de responsabilidad social de GEIFEM.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#catalogo">
              <Button>Ver todos los cursos</Button>
            </Link>
            <Link href="#como-funciona">
              <Button variant="ghost">¿Cómo funciona?</Button>
            </Link>
          </div>
        </div>
        <HeroVisual />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALOR_PROPUESTA.map(({ icon: Icon, titulo, texto }) => (
            <StaggerItem key={titulo}>
              <div className="h-full rounded-2xl border border-border bg-surface p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </span>
                <p className="mt-3 font-bold text-ink">{titulo}</p>
                <p className="mt-1 text-sm text-ink-soft">{texto}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {stats.totalCursos > 0 && (
        <section className="bg-ink py-14">
          <div className="mx-auto max-w-6xl px-6">
            <StaggerGroup className="grid grid-cols-3 gap-8 text-center">
              {stats_.map(({ icon: Icon, value, label }) => (
                <StaggerItem key={label}>
                  <Icon size={22} className="mx-auto text-accent-400" />
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    <AnimatedCounter value={value} />
                  </p>
                  <p className="mt-1 text-sm text-white/70">{label}</p>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      <section id="como-funciona" className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold text-ink">¿Cómo funciona?</h2>
          </ScrollReveal>
          <StaggerGroup className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {COMO_FUNCIONA.map(({ icon: Icon, titulo, texto }, i) => (
              <StaggerItem key={titulo} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {i + 1}
                </div>
                <Icon size={22} className="mx-auto mt-3 text-brand-600" />
                <p className="mt-2 font-bold text-ink">{titulo}</p>
                <p className="mt-1 text-sm text-ink-soft">{texto}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {bundleCourses.length >= 2 && (
        <section className="mx-auto max-w-6xl px-6 py-6">
          <ScrollReveal>
            <Card className="flex flex-col items-start justify-between gap-4 border-brand-200 bg-brand-50 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-brand-800">Bundle {bundleSection.nombre} completo</p>
                <p className="text-sm text-brand-700">
                  Los {bundleCourses.length} cursos de {bundleSection.nombre}, con certificado incluido.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-extrabold text-brand-800">{formatCOP(bundlePrecio)}</span>
                <Button variant="secondary">Comprar bundle</Button>
              </div>
            </Card>
          </ScrollReveal>
        </section>
      )}

      <div id="catalogo">
        {courses.length === 0 ? (
          <section className="mx-auto max-w-6xl px-6 py-16">
            <Card className="text-center text-ink-soft">
              Todavía no hay cursos publicados. Muy pronto vas a encontrar aquí el catálogo completo.
            </Card>
          </section>
        ) : (
          <CatalogBrowser courses={courses} categories={categories} sections={sections} />
        )}
      </div>

      <TestimonialsSection testimonials={testimonials} />

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <ScrollReveal>
            <h2 className="mb-10 text-center text-2xl font-bold text-ink">Preguntas frecuentes</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <FaqAccordion />
          </ScrollReveal>
        </div>
      </section>

      <section id="becas" className="mx-auto max-w-6xl px-6 py-16">
        <ScrollReveal>
          <Card className="border-accent-200 bg-accent-50">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-400 text-white">
                <Sparkles size={20} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-ink">Becas GEIFEM</h2>
                <p className="mt-1 text-ink-soft">
                  Por cada matrículas pagas se libera un cupo 100% gratuito para un joven que no
                  puede pagar. Este mes:{" "}
                  <strong className="text-ink">{becasStats.becasOtorgadas} becas otorgadas</strong>{" "}
                  de {becasStats.matriculasPagas} matrículas pagas.
                </p>
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-ink-soft">
        <p>GEIFEM Academy · responsabilidad social de GEIFEM Consultoría</p>
        <p className="mt-3 flex justify-center gap-4 text-xs">
          <Link href="/terminos" className="hover:text-ink hover:underline">
            Términos y condiciones
          </Link>
          <Link href="/privacidad" className="hover:text-ink hover:underline">
            Política de privacidad
          </Link>
        </p>
        <p className="mt-1 text-xs">Desarrollado por Vegora</p>
      </footer>
    </div>
  );
}
