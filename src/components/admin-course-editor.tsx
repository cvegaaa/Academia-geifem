"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  FileText,
  Loader2,
  Minus,
  Plus,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { MaterialFileUpload } from "@/components/admin-material-upload";
import { CategoryTagsInput } from "@/components/admin-category-tags";
import type { Course, Question, QuestionType, Section, Unit } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<QuestionType, string> = {
  unica: "Selección única",
  multiple: "Selección múltiple",
  vf: "Verdadero/Falso",
};

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyUnit(orden: number): Unit {
  return {
    id: newId("u"),
    titulo: "Nueva unidad",
    orden,
    materialEscrito: { titulo: "", resumen: "" },
    videoRefuerzo: { titulo: "", youtubeId: "", duracion: "" },
    videoEjercicio: { titulo: "", youtubeId: "", duracion: "" },
    evaluacion: { titulo: "Evaluación", preguntas: [] },
  };
}

function emptyQuestion(): Question {
  return {
    id: newId("q"),
    type: "unica",
    enunciado: "",
    opciones: ["Opción 1", "Opción 2"],
    correctas: [0],
  };
}

export function AdminCourseEditor({
  course,
  onSave,
  onCancel,
  saving = false,
  allCategories,
  sections,
}: {
  course: Course;
  onSave: (updated: Course) => void;
  onCancel: () => void;
  saving?: boolean;
  allCategories: string[];
  sections: Section[];
}) {
  const [draft, setDraft] = useState<Course>(course);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(draft.unidades[0]?.id ?? null);

  function setField<K extends keyof Course>(key: K, value: Course[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateUnit(unitId: string, updater: (u: Unit) => Unit) {
    setDraft((prev) => ({
      ...prev,
      unidades: prev.unidades.map((u) => (u.id === unitId ? updater(u) : u)),
    }));
  }

  function addUnit() {
    const unit = emptyUnit(draft.unidades.length + 1);
    setDraft((prev) => ({ ...prev, unidades: [...prev.unidades, unit] }));
    setExpandedUnit(unit.id);
  }

  function removeUnit(unitId: string) {
    setDraft((prev) => ({
      ...prev,
      unidades: prev.unidades
        .filter((u) => u.id !== unitId)
        .map((u, i) => ({ ...u, orden: i + 1 })),
    }));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={onCancel} className="text-sm font-medium text-brand-700 hover:underline">
            ← Volver a cursos
          </button>
          <h1 className="mt-1 text-2xl font-bold text-ink">{draft.titulo || "Nuevo curso"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(draft)} disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <p className="mb-4 font-semibold text-ink">Datos del curso</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Título">
            <input
              value={draft.titulo}
              onChange={(e) => setField("titulo", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Sección">
            <select
              value={draft.seccionId ?? ""}
              onChange={(e) => setField("seccionId", e.target.value || null)}
              className="input"
            >
              <option value="">Sin sección</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Resumen corto (para el catálogo)">
            <input
              value={draft.resumen}
              onChange={(e) => setField("resumen", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Duración (horas, máx. 120 — tope ETDH Colombia)">
            <input
              type="number"
              min="0"
              max="120"
              value={draft.duracionHoras}
              onChange={(e) => setField("duracionHoras", Number(e.target.value) || 0)}
              className="input"
            />
          </Field>
          <Field label="Precio (COP, mínimo $5.000 — límite de ePayco)">
            <input
              type="number"
              value={draft.precio}
              onChange={(e) => setField("precio", Number(e.target.value) || 0)}
              className="input"
            />
          </Field>
          <Field label="Descripción completa (ficha del curso)">
            <textarea
              value={draft.descripcion}
              onChange={(e) => setField("descripcion", e.target.value)}
              className="input min-h-20"
            />
          </Field>
          <Field label="Categorías">
            <CategoryTagsInput
              value={draft.categorias}
              onChange={(next) => setField("categorias", next)}
              suggestions={allCategories}
            />
          </Field>
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-ink">Unidades ({draft.unidades.length})</p>
        <Button variant="secondary" onClick={addUnit}>
          <Plus size={16} /> Nueva unidad
        </Button>
      </div>

      <div className="space-y-3">
        {draft.unidades.map((unit) => (
          <UnitEditor
            key={unit.id}
            unit={unit}
            expanded={expandedUnit === unit.id}
            onToggle={() => setExpandedUnit((e) => (e === unit.id ? null : unit.id))}
            onChange={(updater) => updateUnit(unit.id, updater)}
            onRemove={() => removeUnit(unit.id)}
          />
        ))}
        {draft.unidades.length === 0 && (
          <Card className="text-center text-sm text-ink-soft">
            Este curso todavía no tiene unidades. Agrega la primera con "Nueva unidad".
          </Card>
        )}
      </div>
    </div>
  );
}

function UnitEditor({
  unit,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  unit: Unit;
  expanded: boolean;
  onToggle: () => void;
  onChange: (updater: (u: Unit) => Unit) => void;
  onRemove: () => void;
}) {
  return (
    <Card className="p-0">
      <div className="flex items-center gap-2 p-4">
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Badge>Unidad {unit.orden}</Badge>
          <input
            value={unit.titulo}
            onChange={(e) => onChange((u) => ({ ...u, titulo: e.target.value }))}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 font-medium text-ink hover:border-border focus:border-border focus:outline-none"
          />
        </button>
        <button className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" onClick={onRemove}>
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border p-4">
          <SubBlock icon={<FileText size={16} />} title="Material escrito">
            <input
              placeholder="Título del material"
              value={unit.materialEscrito.titulo}
              onChange={(e) =>
                onChange((u) => ({ ...u, materialEscrito: { ...u.materialEscrito, titulo: e.target.value } }))
              }
              className="input mb-2"
            />
            <textarea
              placeholder="Resumen / contenido"
              value={unit.materialEscrito.resumen}
              onChange={(e) =>
                onChange((u) => ({ ...u, materialEscrito: { ...u.materialEscrito, resumen: e.target.value } }))
              }
              className="input min-h-16"
            />
            <MaterialFileUpload
              archivoUrl={unit.materialEscrito.archivoUrl}
              archivoNombre={unit.materialEscrito.archivoNombre}
              onChange={(archivoUrl, archivoNombre) =>
                onChange((u) => ({ ...u, materialEscrito: { ...u.materialEscrito, archivoUrl, archivoNombre } }))
              }
            />
          </SubBlock>

          <SubBlock icon={<PlayCircle size={16} />} title="Video de refuerzo">
            <VideoFields
              value={unit.videoRefuerzo}
              onChange={(v) => onChange((u) => ({ ...u, videoRefuerzo: v }))}
            />
          </SubBlock>

          <SubBlock icon={<PlayCircle size={16} />} title="Video de ejercicio">
            <VideoFields
              value={unit.videoEjercicio}
              onChange={(v) => onChange((u) => ({ ...u, videoEjercicio: v }))}
            />
          </SubBlock>

          <SubBlock icon={<FileText size={16} />} title="Evaluación">
            <input
              placeholder="Título de la evaluación"
              value={unit.evaluacion.titulo}
              onChange={(e) =>
                onChange((u) => ({ ...u, evaluacion: { ...u.evaluacion, titulo: e.target.value } }))
              }
              className="input mb-3"
            />
            <div className="space-y-3">
              {unit.evaluacion.preguntas.map((q, qi) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  onChange={(next) =>
                    onChange((u) => ({
                      ...u,
                      evaluacion: {
                        ...u.evaluacion,
                        preguntas: u.evaluacion.preguntas.map((p, i) => (i === qi ? next : p)),
                      },
                    }))
                  }
                  onRemove={() =>
                    onChange((u) => ({
                      ...u,
                      evaluacion: {
                        ...u.evaluacion,
                        preguntas: u.evaluacion.preguntas.filter((_, i) => i !== qi),
                      },
                    }))
                  }
                />
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() =>
                onChange((u) => ({
                  ...u,
                  evaluacion: { ...u.evaluacion, preguntas: [...u.evaluacion.preguntas, emptyQuestion()] },
                }))
              }
            >
              <Plus size={14} /> Agregar pregunta
            </Button>
          </SubBlock>
        </div>
      )}
    </Card>
  );
}

function VideoFields({
  value,
  onChange,
}: {
  value: { titulo: string; youtubeId: string; duracion: string };
  onChange: (v: { titulo: string; youtubeId: string; duracion: string }) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr]">
      <input
        placeholder="Título del video"
        value={value.titulo}
        onChange={(e) => onChange({ ...value, titulo: e.target.value })}
        className="input"
      />
      <input
        placeholder="ID de YouTube"
        value={value.youtubeId}
        onChange={(e) => onChange({ ...value, youtubeId: e.target.value })}
        className="input"
      />
      <input
        placeholder="Duración (mm:ss)"
        value={value.duracion}
        onChange={(e) => onChange({ ...value, duracion: e.target.value })}
        className="input"
      />
    </div>
  );
}

function QuestionEditor({
  question,
  onChange,
  onRemove,
}: {
  question: Question;
  onChange: (q: Question) => void;
  onRemove: () => void;
}) {
  function setType(type: QuestionType) {
    const opciones = type === "vf" ? ["Verdadero", "Falso"] : question.opciones;
    onChange({ ...question, type, opciones, correctas: [0] });
  }

  function updateOpcion(i: number, value: string) {
    onChange({ ...question, opciones: question.opciones.map((o, idx) => (idx === i ? value : o)) });
  }

  function toggleCorrecta(i: number) {
    if (question.type === "multiple") {
      const has = question.correctas.includes(i);
      onChange({
        ...question,
        correctas: has ? question.correctas.filter((c) => c !== i) : [...question.correctas, i],
      });
    } else {
      onChange({ ...question, correctas: [i] });
    }
  }

  function addOpcion() {
    onChange({ ...question, opciones: [...question.opciones, `Opción ${question.opciones.length + 1}`] });
  }

  function removeOpcion(i: number) {
    onChange({
      ...question,
      opciones: question.opciones.filter((_, idx) => idx !== i),
      correctas: question.correctas.filter((c) => c !== i).map((c) => (c > i ? c - 1 : c)),
    });
  }

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <select
          value={question.type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="input w-auto text-xs"
        >
          {Object.entries(TIPO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="ml-auto rounded-lg p-1.5 text-red-500 hover:bg-red-50" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>

      <input
        placeholder="Enunciado de la pregunta"
        value={question.enunciado}
        onChange={(e) => onChange({ ...question, enunciado: e.target.value })}
        className="input mt-2"
      />

      <p className="mt-3 text-xs text-ink-soft">
        Marca {question.type === "multiple" ? "la(s) opción(es) correcta(s)" : "la opción correcta"}:
      </p>
      <div className="mt-1.5 space-y-1.5">
        {question.opciones.map((op, i) => {
          const isCorrect = question.correctas.includes(i);
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-1.5 pl-2",
                isCorrect ? "border-brand-300 bg-brand-50" : "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => toggleCorrecta(i)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                  isCorrect ? "text-brand-700" : "text-ink-soft hover:text-brand-600",
                )}
                title="Marcar como respuesta correcta"
              >
                {isCorrect ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                Correcta
              </button>
              <input
                value={op}
                onChange={(e) => updateOpcion(i, e.target.value)}
                disabled={question.type === "vf"}
                className="input flex-1"
              />
              {question.type !== "vf" && question.opciones.length > 2 && (
                <button onClick={() => removeOpcion(i)} className="text-ink-soft hover:text-red-500">
                  <Minus size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {question.type !== "vf" && (
        <Button variant="ghost" className="mt-2 py-1 text-xs" onClick={addOpcion}>
          <Plus size={12} /> Agregar opción
        </Button>
      )}
    </div>
  );
}

function SubBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-700">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
