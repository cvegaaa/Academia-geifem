"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Card } from "@/components/ui";
import type { Section } from "@/lib/types";

export function AdminSectionsManager({
  sections,
  onCreate,
  onRename,
  onDelete,
  pending,
}: {
  sections: Section[];
  onCreate: (nombre: string) => void;
  onRename: (id: string, nombre: string) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");

  function startEdit(s: Section) {
    setEditingId(s.id);
    setEditingName(s.nombre);
  }

  function saveEdit() {
    if (!editingId || !editingName.trim()) return;
    onRename(editingId, editingName.trim());
    setEditingId(null);
  }

  function addSection() {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
  }

  return (
    <Card className="mb-6">
      <p className="mb-1 font-semibold text-ink">Secciones del catálogo</p>
      <p className="mb-4 text-sm text-ink-soft">
        Agrupan los cursos en el catálogo público (antes "Bloque A"/"Bloque B" fijo). Un curso sin
        sección aparece bajo "Sin sección" — nunca desaparece si borras una.
      </p>

      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            {editingId === s.id ? (
              <>
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="input flex-1"
                />
                <button onClick={saveEdit} className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-muted">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-ink">{s.nombre}</span>
                <button onClick={() => startEdit(s)} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-muted">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  disabled={pending}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSection()}
          placeholder="Nombre de la nueva sección"
          className="input flex-1"
        />
        <Button variant="secondary" onClick={addSection} disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Agregar
        </Button>
      </div>
    </Card>
  );
}
