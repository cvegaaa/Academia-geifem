import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testimonials } from "@/lib/db/schema";

export interface Testimonial {
  id: string;
  nombre: string;
  rol: string;
  texto: string;
}

export async function listTestimonials(): Promise<Testimonial[]> {
  const rows = await db.query.testimonials.findMany({ orderBy: [desc(testimonials.createdAt)] });
  return rows.map((r) => ({ id: r.id, nombre: r.nombre, rol: r.rol, texto: r.texto }));
}

export async function createTestimonial(input: { nombre: string; rol: string; texto: string }): Promise<Testimonial> {
  const [row] = await db.insert(testimonials).values(input).returning();
  return { id: row.id, nombre: row.nombre, rol: row.rol, texto: row.texto };
}

export async function deleteTestimonial(id: string): Promise<void> {
  await db.delete(testimonials).where(eq(testimonials.id, id));
}
