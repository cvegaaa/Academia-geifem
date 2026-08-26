"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, LogOut, Users } from "lucide-react";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { StudentProgressRow } from "@/server/instructor";
import { cn } from "@/lib/utils";

export function InstructorDashboard({ rows, userName }: { rows: StudentProgressRow[]; userName: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  async function logout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const cursos = Array.from(new Set(rows.map((r) => r.cursoTitulo)));

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-ink">
            <Image src="/brand/logo.png" alt="GEIFEM Academy" width={32} height={32} className="rounded-lg" />
            Panel docente
          </div>
          <div className="flex items-center gap-4 text-sm text-ink-soft">
            <span>{userName}</span>
            <button onClick={logout} className="flex items-center gap-1.5 hover:text-ink">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-1 text-2xl font-bold text-ink">Progreso de estudiantes</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Solo lectura — matrículas pagadas, avance por unidad y resultados de evaluación.
        </p>

        {rows.length === 0 ? (
          <Card className="text-center text-ink-soft">Todavía no hay estudiantes matriculados.</Card>
        ) : (
          cursos.map((curso) => {
            const cursoRows = rows.filter((r) => r.cursoTitulo === curso);
            return (
              <div key={curso} className="mb-8">
                <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
                  <Users size={16} /> {curso}
                  <Badge tone="neutral">{cursoRows.length} estudiante{cursoRows.length === 1 ? "" : "s"}</Badge>
                </p>
                <Card className="p-0">
                  <div className="divide-y divide-border">
                    {cursoRows.map((r) => (
                      <div key={r.enrollmentId}>
                        <button
                          onClick={() => setExpanded((e) => (e === r.enrollmentId ? null : r.enrollmentId))}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left"
                        >
                          {expanded === r.enrollmentId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink">{r.estudianteNombre}</p>
                            <p className="text-xs text-ink-soft">{r.estudianteEmail}</p>
                          </div>
                          <div className="w-32">
                            <ProgressBar value={r.porcentajeCompletado} />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold text-ink-soft">
                            {r.porcentajeCompletado}%
                          </span>
                        </button>

                        {expanded === r.enrollmentId && (
                          <div className="space-y-2 bg-surface-muted px-4 py-3">
                            {r.unidades.map((u) => (
                              <div key={u.unitId} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-ink">
                                  <Badge tone="neutral">Unidad {u.orden}</Badge>
                                  {u.titulo}
                                </span>
                                <div className="flex items-center gap-3 text-xs text-ink-soft">
                                  <StepDot label="Material" done={u.materialVisto} />
                                  <StepDot label="Video refuerzo" done={u.videoRefuerzoVisto} />
                                  <StepDot label="Video ejercicio" done={u.videoEjercicioVisto} />
                                  <span
                                    className={cn(
                                      "flex items-center gap-1",
                                      u.evaluacionAprobada ? "text-brand-700" : "text-ink-soft",
                                    )}
                                  >
                                    {u.evaluacionAprobada ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                    Evaluación{u.puntaje !== null ? ` (${u.puntaje}%)` : ""}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

function StepDot({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={cn("flex items-center gap-1", done ? "text-brand-700" : "text-ink-soft")} title={label}>
      {done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
    </span>
  );
}
