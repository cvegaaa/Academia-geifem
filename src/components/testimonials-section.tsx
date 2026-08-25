"use client";

import { Quote } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/scroll-reveal";
import { Card } from "@/components/ui";
import type { Testimonial } from "@/server/testimonials";

// No se renderiza nada si no hay testimonios reales cargados desde el admin — nunca se muestran
// ejemplos inventados. Ver arquitectura-academia § Landing.
export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="mb-10 text-center text-2xl font-bold text-ink">Lo que dicen quienes ya tomaron un curso</h2>
      <StaggerGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <StaggerItem key={t.id}>
            <Card className="h-full">
              <Quote size={20} className="text-brand-300" />
              <p className="mt-3 text-sm text-ink-soft">"{t.texto}"</p>
              <p className="mt-4 font-semibold text-ink">{t.nombre}</p>
              {t.rol && <p className="text-xs text-ink-soft">{t.rol}</p>}
            </Card>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
