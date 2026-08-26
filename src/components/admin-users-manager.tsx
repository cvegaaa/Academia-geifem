"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, UserCog } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import type { StaffRole, StaffUser } from "@/server/users";

const ROLE_LABEL: Record<StaffRole, string> = {
  instructor: "Docente",
  admin: "Admin",
  superadmin: "Superadmin",
};

const ROLE_TONE: Record<StaffRole, "brand" | "accent" | "neutral"> = {
  instructor: "neutral",
  admin: "brand",
  superadmin: "accent",
};

export function AdminUsersManager({
  staff,
  currentUserId,
  onCreate,
  onDelete,
  pending,
}: {
  staff: StaffUser[];
  currentUserId: string;
  onCreate: (input: { name: string; email: string; password: string; role: StaffRole }) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("instructor");
  const [formError, setFormError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !email.trim()) return;
    if (password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    onCreate({ name: name.trim(), email: email.trim(), password, role });
    setName("");
    setEmail("");
    setPassword("");
    setRole("instructor");
  }

  return (
    <Card>
      <p className="mb-1 flex items-center gap-2 font-semibold text-ink">
        <UserCog size={16} /> Cuentas con acceso al panel
      </p>
      <p className="mb-4 text-sm text-ink-soft">
        Crea aquí las cuentas de docentes y administradores — no hace falta el script de terminal
        para esto. Un docente solo ve el progreso de los estudiantes en{" "}
        <code className="text-xs">/instructor</code>, sin acceso a pagos, cupones ni becas.
      </p>

      <div className="mb-4 space-y-2">
        {staff.length === 0 && <p className="text-sm text-ink-soft">Todavía no hay cuentas de staff.</p>}
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                {s.name}
                <Badge tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role]}</Badge>
                {s.id === currentUserId && <span className="text-xs text-ink-soft">(tú)</span>}
              </p>
              <p className="text-xs text-ink-soft">{s.email}</p>
            </div>
            {s.id !== currentUserId && (
              <button
                onClick={() => onDelete(s.id)}
                disabled={pending}
                className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-2 border-t border-border pt-4">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="input flex-1" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Correo"
            className="input flex-1"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            className="input flex-1"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className="input w-40">
            <option value="instructor">Docente</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
        {formError && <p className="text-sm text-red-500">{formError}</p>}
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Crear cuenta
        </Button>
      </form>
    </Card>
  );
}
