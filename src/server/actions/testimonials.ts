"use server";

import { revalidatePath } from "next/cache";
import * as testimonialsData from "@/server/testimonials";
import type { Testimonial } from "@/server/testimonials";
import { requireAdmin } from "@/server/actions/require-admin";

export async function createTestimonialAction(input: {
  nombre: string;
  rol: string;
  texto: string;
}): Promise<Testimonial> {
  await requireAdmin();
  const testimonial = await testimonialsData.createTestimonial(input);
  revalidatePath("/admin");
  revalidatePath("/");
  return testimonial;
}

export async function deleteTestimonialAction(id: string): Promise<void> {
  await requireAdmin();
  await testimonialsData.deleteTestimonial(id);
  revalidatePath("/admin");
  revalidatePath("/");
}
