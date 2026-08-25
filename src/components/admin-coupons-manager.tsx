"use client";

import { useState } from "react";
import { Loader2, Plus, Ticket, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import type { Coupon } from "@/server/coupons";
import { formatCOP } from "@/lib/utils";

export function AdminCouponsManager({
  coupons,
  onCreate,
  onToggle,
  onDelete,
  pending,
}: {
  coupons: Coupon[];
  onCreate: (input: {
    codigo: string;
    tipo: "porcentaje" | "fijo";
    valor: number;
    usosMaximos: number | null;
    fechaExpiracion: string | null;
  }) => void;
  onToggle: (id: string, activo: boolean) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<"porcentaje" | "fijo">("porcentaje");
  const [valor, setValor] = useState("");
  const [usosMaximos, setUsosMaximos] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const valorNum = Number(valor);
    if (!codigo.trim() || !valorNum || valorNum <= 0) return;
    if (tipo === "porcentaje" && valorNum > 100) return;

    onCreate({
      codigo: codigo.trim(),
      tipo,
      valor: tipo === "fijo" ? Math.round(valorNum * 100) : valorNum,
      usosMaximos: usosMaximos ? Number(usosMaximos) : null,
      fechaExpiracion: fechaExpiracion || null,
    });
    setCodigo("");
    setValor("");
    setUsosMaximos("");
    setFechaExpiracion("");
  }

  return (
    <Card>
      <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
        <Ticket size={16} /> Cupones de descuento
      </p>
      <p className="mb-4 text-sm text-ink-soft">
        El estudiante lo aplica en el carrito antes de pagar. El descuento se valida siempre en
        el servidor al momento de pagar, aunque el código haya cambiado desde que se mostró la
        vista previa.
      </p>

      <div className="mb-4 space-y-2">
        {coupons.length === 0 && <p className="text-sm text-ink-soft">Todavía no hay cupones creados.</p>}
        {coupons.map((c) => {
          const expirado = c.fechaExpiracion && new Date(c.fechaExpiracion) < new Date();
          const agotado = c.usosMaximos !== null && c.usosActuales >= c.usosMaximos;
          return (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-ink">{c.codigo}</span>
                  <Badge tone={c.activo && !expirado && !agotado ? "brand" : "neutral"}>
                    {!c.activo ? "desactivado" : expirado ? "expirado" : agotado ? "agotado" : "activo"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {c.tipo === "porcentaje" ? `${c.valor}% de descuento` : `${formatCOP(c.valor / 100)} de descuento`}
                  {" · "}
                  {c.usosActuales} uso{c.usosActuales === 1 ? "" : "s"}
                  {c.usosMaximos !== null ? ` de ${c.usosMaximos}` : " (sin límite)"}
                  {c.fechaExpiracion ? ` · vence ${new Date(c.fechaExpiracion).toLocaleDateString("es-CO")}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => onToggle(c.id, !c.activo)}
                  disabled={pending}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-surface-muted"
                >
                  {c.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  disabled={pending}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="space-y-2 border-t border-border pt-4">
        <div className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código (ej. BIENVENIDA20)"
            className="input flex-1 font-mono uppercase"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "porcentaje" | "fijo")}
            className="input w-40"
          >
            <option value="porcentaje">% Porcentaje</option>
            <option value="fijo">$ Monto fijo</option>
          </select>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            type="number"
            min="1"
            max={tipo === "porcentaje" ? 100 : undefined}
            placeholder={tipo === "porcentaje" ? "20" : "10000"}
            className="input w-32"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={usosMaximos}
            onChange={(e) => setUsosMaximos(e.target.value)}
            type="number"
            min="1"
            placeholder="Usos máximos (opcional)"
            className="input flex-1"
          />
          <input
            value={fechaExpiracion}
            onChange={(e) => setFechaExpiracion(e.target.value)}
            type="date"
            className="input flex-1"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Crear cupón
        </Button>
      </form>
    </Card>
  );
}
