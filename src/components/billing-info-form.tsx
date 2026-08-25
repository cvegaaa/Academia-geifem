"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

const TIPOS = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "PA", label: "Pasaporte" },
  { value: "NIT", label: "NIT" },
];

// Requerido por la DIAN para poder emitir la factura electrónica de cada compra — ver
// arquitectura-academia § Facturación electrónica.
export function BillingInfoForm({
  identificationType,
  identificationNumber,
}: {
  identificationType: string | null;
  identificationNumber: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!identificationNumber);
  const [tipo, setTipo] = useState(identificationType ?? "CC");
  const [numero, setNumero] = useState(identificationNumber ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await authClient.updateUser({ identificationType: tipo, identificationNumber: numero });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <Card className="mb-10 flex items-center justify-between border-brand-200 bg-brand-50">
        <p className="flex items-center gap-2 text-sm text-brand-800">
          <FileCheck2 size={16} />
          Datos de facturación completos ({identificationType} {identificationNumber})
        </p>
        <button onClick={() => setEditing(true)} className="text-sm font-medium text-brand-700 hover:underline">
          Editar
        </button>
      </Card>
    );
  }

  return (
    <Card className="mb-10">
      <p className="font-semibold text-ink">Datos de facturación</p>
      <p className="mt-1 text-sm text-ink-soft">
        Necesarios para emitir tu factura electrónica al comprar un curso.
      </p>
      <form onSubmit={save} className="mt-4 flex flex-wrap gap-3">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input w-auto">
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          required
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Número de documento"
          className="input flex-1"
        />
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Card>
  );
}
