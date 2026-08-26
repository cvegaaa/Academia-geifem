"use server";

import { revalidatePath } from "next/cache";
import * as coursesData from "@/server/courses";
import type { Course } from "@/lib/types";
import { requireAdmin } from "@/server/actions/require-admin";

export async function createCourseAction(): Promise<Course> {
  await requireAdmin();
  const course = await coursesData.createDraftCourse();
  revalidatePath("/admin");
  return course;
}

export async function saveCourseAction(course: Course): Promise<void> {
  await requireAdmin();
  await coursesData.saveCourse(course);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/cursos/${course.slug}`);
  revalidatePath(`/estudiante/${course.slug}`);
}

export async function deleteCourseAction(slug: string): Promise<void> {
  await requireAdmin();
  await coursesData.deleteCourse(slug);
  revalidatePath("/admin");
  revalidatePath("/");
}
