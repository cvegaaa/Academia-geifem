"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/server/actions/require-admin";
import * as usersData from "@/server/users";
import type { StaffRole, StaffUser } from "@/server/users";

export async function createStaffUserAction(input: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}): Promise<StaffUser> {
  await requireAdmin();
  const staff = await usersData.createStaffUser(input);
  revalidatePath("/admin");
  return staff;
}

export async function deleteStaffUserAction(id: string): Promise<void> {
  await requireAdmin();
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.id === id) {
    throw new Error("No puedes eliminar tu propia cuenta desde aquí");
  }
  await usersData.deleteStaffUser(id);
  revalidatePath("/admin");
}
