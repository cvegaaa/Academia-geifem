"use server";

import { revalidatePath } from "next/cache";
import * as coursesData from "@/server/courses";
import type { Section } from "@/lib/types";
import { requireAdmin } from "@/server/actions/require-admin";

export async function createSectionAction(nombre: string): Promise<Section> {
  await requireAdmin();
  const section = await coursesData.createSection(nombre);
  revalidatePath("/admin");
  revalidatePath("/");
  return section;
}

export async function renameSectionAction(id: string, nombre: string): Promise<void> {
  await requireAdmin();
  await coursesData.renameSection(id, nombre);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteSectionAction(id: string): Promise<void> {
  await requireAdmin();
  await coursesData.deleteSection(id);
  revalidatePath("/admin");
  revalidatePath("/");
}
