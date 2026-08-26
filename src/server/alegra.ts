import { env } from "@/lib/env";

const BASE = "https://api.alegra.com/api/v1";
const MAX_HORAS_ETDH = 120; // tope regulatorio Colombia para formación no formal (ETDH)

async function alegraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.ALEGRA_API_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Alegra ${path} falló: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface AlegraContact {
  id: string;
  name: string;
  identification?: string;
}

/** Busca un contacto por número de identificación; lo crea si no existe. */
export async function findOrCreateContact(input: {
  name: string;
  email: string;
  identification: string;
  identificationType?: "CC" | "NIT" | "CE" | "PA";
}): Promise<AlegraContact> {
  const found = await alegraFetch<AlegraContact[]>(
    `/contacts?identification=${encodeURIComponent(input.identification)}`,
  );
  if (found.length > 0) return found[0];

  return alegraFetch<AlegraContact>("/contacts", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      identificationObject: { type: input.identificationType ?? "CC", number: input.identification },
      type: ["client"],
      kindOfPerson: "PERSON_ENTITY",
      regime: "SIMPLIFIED_REGIME",
    }),
  });
}

/**
 * Descripción exigida por el negocio (no solo el nombre del curso): de qué es la formación,
 * modalidad e intensidad horaria. El tope regulatorio colombiano de 120h para formación no
 * formal (ETDH) ya se valida al guardar el curso (src/server/courses.ts::saveCourse) — esta
 * comprobación es solo una segunda barrera defensiva antes de facturar, no la principal.
 */
function buildDescripcion(course: { titulo: string; duracionHoras: number }): string {
  if (course.duracionHoras > MAX_HORAS_ETDH) {
    throw new Error(
      `El curso "${course.titulo}" declara ${course.duracionHoras}h — supera el máximo de ` +
        `${MAX_HORAS_ETDH}h permitido para formación no formal en Colombia. Corrige la duración ` +
        "del curso antes de facturar.",
    );
  }
  return `Formación: ${course.titulo} — Modalidad: Virtual — Intensidad horaria: ${course.duracionHoras} horas`;
}

const IVA_TAX_ID = "4"; // IVA 19% en Alegra — ver arquitectura-academia § Facturación electrónica
const IVA_RATE = 0.19;

export interface CreateInvoiceInput {
  contactId: string;
  course: { titulo: string; duracionHoras: number };
  /** Precio final en pesos que realmente pagó el estudiante (con IVA incluido). */
  precioTotal: number;
}

export interface AlegraInvoice {
  id: string;
  numberTemplate: { number: string; prefix: string | null };
}

/**
 * Crea la factura de venta electrónica bajo la resolución DIAN vigente de GEIFEM. El precio que
 * paga el estudiante es el precio final (IVA incluido) — Alegra necesita el valor base sin IVA
 * por línea para que, al aplicar el 19%, el total de la factura coincida con lo cobrado
 * (Alegra NO aplica el impuesto por defecto del ítem: hay que pasarlo explícito en cada línea,
 * de lo contrario la factura queda sin IVA).
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<AlegraInvoice> {
  const precioBase = Math.round((input.precioTotal / (1 + IVA_RATE)) * 100) / 100;

  return alegraFetch<AlegraInvoice>("/invoices", {
    method: "POST",
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      client: input.contactId,
      numberTemplate: { id: env.ALEGRA_NUMBER_TEMPLATE_ID },
      items: [
        {
          id: env.ALEGRA_ITEM_ID_CURSO,
          price: precioBase,
          quantity: 1,
          tax: [{ id: IVA_TAX_ID }],
          description: buildDescripcion(input.course),
        },
      ],
      paymentForm: "CASH",
      status: "open",
    }),
  });
}

/** Anula una factura de venta ya emitida (ej. facturas de prueba dejadas por error). */
export async function voidInvoice(id: string): Promise<void> {
  await alegraFetch(`/invoices/${id}/void`, { method: "POST" });
}
