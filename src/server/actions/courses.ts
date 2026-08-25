"use server";

import { revalidatePath } from "next/cache";
import * as coursesData from "@/server/courses";
import type { Course } from "@/lib/types";

export async function createCourseAction(): Promise<Course> {
  const course = await coursesData.createDraftCourse();
  revalidatePath("/admin");
  return course;
}

export async function saveCourseAction(course: Course): Promise<void> {
  await coursesData.saveCourse(course);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/cursos/${course.slug}`);
  revalidatePath(`/estudiante/${course.slug}`);
}

export async function deleteCourseAction(slug: string): Promise<void> {
  await coursesData.deleteCourse(slug);
  revalidatePath("/admin");
  revalidatePath("/");
}
