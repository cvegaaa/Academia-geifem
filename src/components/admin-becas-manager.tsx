"use client";

import { useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Beca, BecasStats } from "@/server/becas";

function Stat({ label, value, tone }: { label: string; value: number; tone?: "accent" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <p className={tone === "accent" ? "text-2xl font-extrabold text-accent-600" : "text-2xl font-extrabold text-ink"}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{label}</p>
    </div>
  );
}

export function AdminBecasManager({
  stats,
  becas,
  onCreate,
  onDelete,
  pending,
}: {
  stats: BecasStats;
  becas: Beca[];
  onCreate: (input: { beneficiarioNombre: string; criterio: string }) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [beneficiarioNombre, setBeneficiarioNombre] = useState("");
  const [criterio, setCriterio] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!beneficiarioNombre.trim()) return;
    onCreate({ beneficiarioNombre: beneficiarioNombre.trim(), criterio: criterio.trim() });
    setBeneficiarioNombre("");
    setCriterio("");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink">Becas GEIFEM</h1>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Matrículas pagas" value={stats.matriculasPagas} />
        <Stat label="Becas otorgadas" value={stats.becasOtorgadas} />
        <Stat label="Cupos disponibles para asignar" value={stats.cupoDisponible} tone="accent" />
      </div>

      <Card className="mt-6">
        <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
          <Sparkles size={16} /> Otorgar beca
        </p>
        <p className="mb-4 text-sm text-ink-soft">
          Asignación manual — el cupo disponible se calcula solo (5% de matrículas pagas, política
          de responsabilidad social de GEIFEM). El contador público en la landing se actualiza al
          instante con lo que registres aquí.
        </p>

        <div className="mb-4 space-y-2">
          {becas.length === 0 && <p className="text-sm text-ink-soft">Todavía no se ha otorgado ninguna beca.</p>}
          {becas.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-ink">{b.beneficiarioNombre}</p>
                <p className="text-xs text-ink-soft">
                  {b.criterio || "Sin criterio registrado"} · {new Date(b.fechaAsignacion).toLocaleDateString("es-CO")}
                </p>
              </div>
              <button
                onClick={() => onDelete(b.id)}
                disabled={pending}
                className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-border pt-4">
          <input
            value={beneficiarioNombre}
            onChange={(e) => setBeneficiarioNombre(e.target.value)}
            placeholder="Nombre del estudiante beneficiario"
            className="input flex-1"
          />
          <input
            value={criterio}
            onChange={(e) => setCriterio(e.target.value)}
            placeholder="Criterio (ej. colegio público aliado)"
            className="input flex-1"
          />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Otorgar
          </Button>
        </form>
      </Card>
    </div>
  );
}
