"use server";

import { revalidatePath } from "next/cache";
import * as coursesData from "@/server/courses";
import type { Section } from "@/lib/types";

export async function createSectionAction(nombre: string): Promise<Section> {
  const section = await coursesData.createSection(nombre);
  revalidatePath("/admin");
  revalidatePath("/");
  return section;
}

export async function renameSectionAction(id: string, nombre: string): Promise<void> {
  await coursesData.renameSection(id, nombre);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteSectionAction(id: string): Promise<void> {
  await coursesData.deleteSection(id);
  revalidatePath("/admin");
  revalidatePath("/");
}
