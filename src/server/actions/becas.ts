"use server";

import { revalidatePath } from "next/cache";
import * as becasData from "@/server/becas";
import type { Beca } from "@/server/becas";
import { requireSuperadmin } from "@/server/actions/require-superadmin";

export async function createBecaAction(input: { beneficiarioNombre: string; criterio: string }): Promise<Beca> {
  await requireSuperadmin();
  const beca = await becasData.createBeca(input);
  revalidatePath("/admin");
  revalidatePath("/");
  return beca;
}

export async function deleteBecaAction(id: string): Promise<void> {
  await requireSuperadmin();
  await becasData.deleteBeca(id);
  revalidatePath("/admin");
  revalidatePath("/");
}
