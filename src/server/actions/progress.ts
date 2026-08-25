"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getCourseBySlug } from "@/server/courses";
import { getEnrollmentForUser, markStep, type StepKey } from "@/server/progress";

const UMBRAL_APROBACION = 60; // % mínimo para aprobar la evaluación de una unidad

export type MarkStepResult =
  | { ok: true; passed: boolean; puntaje?: number; courseComplete: boolean; certificateCode: string | null }
  | { ok: false; error: string };

export async function markStepAction(
  courseSlug: string,
  unitId: string,
  step: StepKey,
  answers?: Record<string, number[]>,
): Promise<MarkStepResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "not_authenticated" };

  const found = await getEnrollmentForUser(session.user.id, courseSlug);
  if (!found) return { ok: false, error: "not_enrolled" };

  if (step !== "evaluacion") {
    const result = await markStep(found.enrollment.id, unitId, step);
    revalidatePath(`/estudiante/${courseSlug}`);
    return { ok: true, passed: true, ...result };
  }

  const course = await getCourseBySlug(courseSlug);
  const unit = course?.unidades.find((u) => u.id === unitId);
  if (!unit) return { ok: false, error: "unit_not_found" };

  const preguntas = unit.evaluacion.preguntas;
  const correctas = preguntas.filter((q) => {
    const given = (answers?.[q.id] ?? []).slice().sort();
    const expected = q.correctas.slice().sort();
    return given.length === expected.length && given.every((v, i) => v === expected[i]);
  }).length;
  const puntaje = preguntas.length > 0 ? Math.round((correctas / preguntas.length) * 100) : 0;
  const passed = puntaje >= UMBRAL_APROBACION;

  const result = await markStep(found.enrollment.id, unitId, "evaluacion", { puntaje, aprobado: passed });
  revalidatePath(`/estudiante/${courseSlug}`);
  return { ok: true, passed, puntaje, ...result };
}
