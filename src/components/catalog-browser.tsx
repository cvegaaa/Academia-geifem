"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Search, Users, X } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { Course, Section } from "@/lib/types";
import { cn, formatCOP } from "@/lib/utils";

const BADGE_TONES = ["brand", "accent"] as const;

export function CatalogBrowser({
  courses,
  categories,
  sections,
}: {
  courses: Course[];
  categories: string[];
  sections: Section[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  function toggleCategory(cat: string) {
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesQuery =
        !q || c.titulo.toLowerCase().includes(q) || c.resumen.toLowerCase().includes(q);
      const matchesCategories =
        activeCategories.length === 0 || activeCategories.every((cat) => c.categorias.includes(cat));
      return matchesQuery && matchesCategories;
    });
  }, [courses, query, activeCategories]);

  const groups = useMemo(() => {
    const bySection = sections.map((s, i) => ({
      key: s.id,
      title: s.nombre,
      tone: BADGE_TONES[i % BADGE_TONES.length],
      courses: filtered.filter((c) => c.seccionId === s.id),
    }));
    const sinSeccion = filtered.filter((c) => !c.seccionId);
    return sinSeccion.length > 0
      ? [...bySection, { key: "sin-seccion", title: "Sin sección", tone: "neutral" as const, courses: sinSeccion }]
      : bySection;
  }, [filtered, sections]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cursos por nombre..."
            className="input pl-9"
          />
        </div>
        {(query || activeCategories.length > 0) && (
          <button
            onClick={() => {
              setQuery("");
              setActiveCategories([]);
            }}
            className="flex items-center gap-1 self-start text-sm font-medium text-ink-soft hover:text-ink"
          >
            <X size={14} /> Limpiar filtros
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-400 bg-brand-600 text-white"
                    : "border-border bg-surface text-ink-soft hover:border-brand-300 hover:text-brand-700",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center text-ink-soft">
          Ningún curso coincide con tu búsqueda. Prueba con otro término o quita algún filtro.
        </Card>
      ) : (
        groups.map((g) => (
          <CourseGrid key={g.key} title={g.title} tone={g.tone} courses={g.courses} />
        ))
      )}
    </section>
  );
}

function CourseGrid({
  title,
  tone,
  courses: list,
}: {
  title: string;
  tone: "brand" | "accent" | "neutral";
  courses: Course[];
}) {
  if (list.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-6 text-2xl font-bold text-ink">{title}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((course) => (
          <Link key={course.slug} href={`/cursos/${course.slug}`}>
            <Card className="flex h-full flex-col justify-between transition-shadow hover:shadow-md">
              <div>
                <Badge tone={tone}>{course.seccionNombre}</Badge>
                <h3 className="mt-3 font-bold text-ink">{course.titulo}</h3>
                <p className="mt-2 text-sm text-ink-soft">{course.resumen}</p>
                {course.categorias.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {course.categorias.map((cat) => (
                      <Badge key={cat} tone="neutral">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {course.duracionHoras}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} /> {course.estudiantes}
                </span>
              </div>
              <p className="mt-3 text-lg font-extrabold text-brand-700">{formatCOP(course.precio)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
