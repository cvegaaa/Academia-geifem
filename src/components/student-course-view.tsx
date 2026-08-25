"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  FileText,
  GraduationCap,
  PlayCircle,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { markStepAction } from "@/server/actions/progress";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";

type StepKey = "material" | "refuerzo" | "ejercicio" | "evaluacion";
type InitialProgress = Record<string, Record<StepKey, boolean>>;

const STEP_ORDER: StepKey[] = ["material", "refuerzo", "ejercicio", "evaluacion"];

const STEP_LABEL: Record<StepKey, string> = {
  material: "Material escrito",
  refuerzo: "Video de refuerzo",
  ejercicio: "Video de ejercicio",
  evaluacion: "Evaluación",
};

const STEP_ICON: Record<StepKey, React.ReactNode> = {
  material: <FileText size={16} />,
  refuerzo: <PlayCircle size={16} />,
  ejercicio: <PlayCircle size={16} />,
  evaluacion: <CheckCircle2 size={16} />,
};

function toCompletedSets(initial: InitialProgress): Record<string, Set<StepKey>> {
  const out: Record<string, Set<StepKey>> = {};
  for (const [unitId, steps] of Object.entries(initial)) {
    const set = new Set<StepKey>();
    for (const [step, done] of Object.entries(steps) as [StepKey, boolean][]) {
      if (done) set.add(step);
    }
    out[unitId] = set;
  }
  return out;
}

export function StudentCourseView({
  course,
  courseSlug,
  initialProgress,
}: {
  course: Course;
  courseSlug: string;
  initialProgress: InitialProgress;
}) {
  const [unitIndex, setUnitIndex] = useState(0);
  const [expandedUnit, setExpandedUnit] = useState(0);
  const [step, setStep] = useState<StepKey>("material");
  const [completed, setCompleted] = useState<Record<string, Set<StepKey>>>(() => toCompletedSets(initialProgress));
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [evalResult, setEvalResult] = useState<{ passed: boolean; puntaje: number } | null>(null);
  const [submittingEval, setSubmittingEval] = useState(false);
  const [, startTransition] = useTransition();

  const unit = course.unidades[unitIndex];
  const unitDone = completed[unit.id] ?? new Set<StepKey>();

  const totalSteps = course.unidades.length * 4;
  const doneSteps = Object.values(completed).reduce((acc, set) => acc + set.size, 0);
  const progressPct = Math.round((doneSteps / totalSteps) * 100);
  const courseComplete = progressPct === 100;

  function openUnit(i: number) {
    setExpandedUnit((prev) => (prev === i ? prev : i));
    setUnitIndex(i);
    setStep("material");
    setEvalResult(null);
  }

  function goToStep(i: number, s: StepKey) {
    setUnitIndex(i);
    setExpandedUnit(i);
    setStep(s);
    setEvalResult(null);
  }

  function markDone(s: StepKey) {
    setCompleted((prev) => {
      const next = new Set(prev[unit.id] ?? []);
      next.add(s);
      return { ...prev, [unit.id]: next };
    });
  }

  function markDoneAndContinue() {
    markDone(step);
    const thisUnitId = unit.id;
    const thisStep = step;
    startTransition(async () => {
      await markStepAction(courseSlug, thisUnitId, thisStep);
    });

    const stepIdx = STEP_ORDER.indexOf(step);
    if (stepIdx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[stepIdx + 1]);
      return;
    }
    if (unitIndex < course.unidades.length - 1) {
      goToStep(unitIndex + 1, "material");
    }
  }

  // La evaluación es distinta: si no aprueba, no avanza — se queda en la misma unidad para
  // reintentar. Por eso espera la respuesta del servidor antes de decidir el siguiente paso.
  async function submitEvaluacion() {
    setSubmittingEval(true);
    setEvalResult(null);
    const result = await markStepAction(courseSlug, unit.id, "evaluacion", answers);
    setSubmittingEval(false);

    if (!result.ok) return;
    setEvalResult({ passed: result.passed, puntaje: result.puntaje ?? 0 });
    if (!result.passed) return; // se queda en la evaluación para reintentar

    markDone("evaluacion");
    if (unitIndex < course.unidades.length - 1) goToStep(unitIndex + 1, "material");
  }

  function toggleAnswer(questionId: string, optionIndex: number, multiple: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      if (multiple) {
        const next = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: [optionIndex] };
    });
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap size={20} />
            </span>
            Academia
          </Link>
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <span>{course.titulo}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-ink-soft">{progressPct}% completado</span>
          <div className="flex-1">
            <ProgressBar value={progressPct} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pb-16 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-2">
          {course.unidades.map((u, i) => {
            const uDone = completed[u.id] ?? new Set<StepKey>();
            const allDone = uDone.size === 4;
            const isExpanded = expandedUnit === i;

            return (
              <div key={u.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <button
                  onClick={() => openUnit(i)}
                  className={cn(
                    "flex w-full items-start gap-2.5 p-3 text-left text-sm",
                    isExpanded && "bg-brand-50",
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className="mt-1 shrink-0 text-ink-soft" />
                  ) : (
                    <ChevronRight size={16} className="mt-1 shrink-0 text-ink-soft" />
                  )}
                  {allDone ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  ) : (
                    <Circle size={18} className="mt-0.5 shrink-0 text-ink-soft" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-ink-soft">Unidad {u.orden}</p>
                    <p className="font-medium text-ink">{u.titulo}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-1 border-t border-border p-2">
                    {STEP_ORDER.map((s) => {
                      const active = i === unitIndex && s === step;
                      const done = uDone.has(s);
                      return (
                        <button
                          key={s}
                          onClick={() => goToStep(i, s)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 pl-8 text-left text-sm",
                            active ? "bg-brand-100 text-brand-800 font-medium" : "text-ink-soft hover:bg-surface-muted",
                          )}
                        >
                          {done ? (
                            <CheckCircle2 size={15} className="shrink-0 text-brand-600" />
                          ) : (
                            <span className="shrink-0">{STEP_ICON[s]}</span>
                          )}
                          {STEP_LABEL[s]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {courseComplete && (
            <Card className="mt-4 border-accent-200 bg-accent-50 text-center">
              <p className="font-bold text-accent-800">¡Curso completado!</p>
              <Link href={`/estudiante/${course.slug}/certificado`}>
                <Button variant="secondary" className="mt-3 w-full">
                  Ver certificado
                </Button>
              </Link>
            </Card>
          )}
        </aside>

        <main>
          <Badge>
            Unidad {unit.orden} de {course.unidades.length} · {STEP_LABEL[step]}
          </Badge>
          <h1 className="mt-2 mb-6 text-2xl font-bold text-ink">{unit.titulo}</h1>

          {step === "material" && (
            <Card>
              <div className="flex items-center gap-2 text-brand-700">
                <FileText size={18} />
                <h2 className="font-bold">{unit.materialEscrito.titulo}</h2>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{unit.materialEscrito.resumen}</p>
              {unit.materialEscrito.archivoUrl && (
                <a
                  href={unit.materialEscrito.archivoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  <FileText size={16} />
                  Descargar {unit.materialEscrito.archivoNombre ?? "material"}
                </a>
              )}
              <StepAction done={unitDone.has("material")} onClick={markDoneAndContinue} label="Marcar como leído" />
            </Card>
          )}

          {(step === "refuerzo" || step === "ejercicio") && (
            <Card>
              <div className="flex items-center gap-2 text-brand-700">
                <PlayCircle size={18} />
                <h2 className="font-bold">
                  {step === "refuerzo" ? unit.videoRefuerzo.titulo : unit.videoEjercicio.titulo}
                </h2>
                <span className="ml-auto text-xs text-ink-soft">
                  {step === "refuerzo" ? unit.videoRefuerzo.duracion : unit.videoEjercicio.duracion}
                </span>
              </div>
              <div className="mt-3 flex aspect-video items-center justify-center rounded-xl bg-ink text-white/70">
                <PlayCircle size={40} />
              </div>
              <StepAction done={unitDone.has(step)} onClick={markDoneAndContinue} label="Marcar como visto" />
            </Card>
          )}

          {step === "evaluacion" && (
            <Card>
              <h2 className="font-bold text-ink">{unit.evaluacion.titulo}</h2>
              <div className="mt-4 space-y-6">
                {unit.evaluacion.preguntas.map((q) => (
                  <div key={q.id}>
                    <p className="font-medium text-ink">{q.enunciado}</p>
                    <div className="mt-2 space-y-1.5">
                      {q.opciones.map((op, i) => {
                        const multiple = q.type === "multiple";
                        const selected = (answers[q.id] ?? []).includes(i);
                        return (
                          <label
                            key={i}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                              selected ? "border-brand-400 bg-brand-50" : "border-border",
                            )}
                          >
                            <input
                              type={multiple ? "checkbox" : "radio"}
                              name={q.id}
                              checked={selected}
                              onChange={() => toggleAnswer(q.id, i, multiple)}
                            />
                            {op}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {evalResult && (
                <p
                  className={cn(
                    "mt-4 rounded-lg px-3 py-2 text-sm font-medium",
                    evalResult.passed ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600",
                  )}
                >
                  {evalResult.passed
                    ? `✓ Aprobaste con ${evalResult.puntaje}%.`
                    : `No aprobaste (${evalResult.puntaje}% — se necesita 60% o más). Revisa tus respuestas e inténtalo de nuevo.`}
                </p>
              )}

              <Button
                variant={unitDone.has("evaluacion") ? "ghost" : "primary"}
                className="mt-4"
                onClick={submitEvaluacion}
                disabled={submittingEval}
              >
                {submittingEval
                  ? "Calificando..."
                  : unitDone.has("evaluacion")
                    ? "✓ Evaluación aprobada — reintentar"
                    : "Enviar evaluación"}
              </Button>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

function StepAction({
  done,
  onClick,
  label,
  doneLabel,
}: {
  done: boolean;
  onClick: () => void;
  label: string;
  doneLabel?: string;
}) {
  return (
    <Button variant={done ? "ghost" : "primary"} className="mt-4" onClick={onClick}>
      {done ? doneLabel ?? "✓ Completado — siguiente" : label}
    </Button>
  );
}
