"use client";

import { useState } from "react";
import { Loader2, Plus, Quote, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Testimonial } from "@/server/testimonials";

export function AdminTestimonialsManager({
  testimonials,
  onCreate,
  onDelete,
  pending,
}: {
  testimonials: Testimonial[];
  onCreate: (input: { nombre: string; rol: string; texto: string }) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [texto, setTexto] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !texto.trim()) return;
    onCreate({ nombre: nombre.trim(), rol: rol.trim(), texto: texto.trim() });
    setNombre("");
    setRol("");
    setTexto("");
  }

  return (
    <Card>
      <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
        <Quote size={16} /> Testimonios de la landing
      </p>
      <p className="mb-4 text-sm text-ink-soft">
        Solo se muestran testimonios reales que cargues aquí — nunca se inventan. Si no hay
        ninguno, la sección de testimonios queda oculta en la página de inicio.
      </p>

      <div className="mb-4 space-y-2">
        {testimonials.length === 0 && (
          <p className="text-sm text-ink-soft">Todavía no hay testimonios cargados.</p>
        )}
        {testimonials.map((t) => (
          <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm text-ink">"{t.texto}"</p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                {t.nombre}
                {t.rol && ` · ${t.rol}`}
              </p>
            </div>
            <button
              onClick={() => onDelete(t.id)}
              disabled={pending}
              className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-2 border-t border-border pt-4">
        <div className="flex gap-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="input flex-1"
          />
          <input
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            placeholder="Rol / curso que tomó (opcional)"
            className="input flex-1"
          />
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Testimonio (cita textual real)"
          className="input min-h-16"
        />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Agregar testimonio
        </Button>
      </form>
    </Card>
  );
}
