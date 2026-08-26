import "dotenv/config";
import { env } from "@/lib/env";

const BASE = "https://api.alegra.com/api/v1";
const NUMBERS = ["203", "204"];

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

interface Invoice {
  id: string;
  status: string;
  numberTemplate: { number: string; prefix: string | null; fullNumber: string };
}

async function main() {
  const invoices = await alegraFetch<Invoice[]>("/invoices?order_field=date&order_direction=DESC&limit=30");

  for (const number of NUMBERS) {
    const invoice = invoices.find((i) => i.numberTemplate?.number === number);
    if (!invoice) {
      console.log(`No se encontró factura con número ${number} entre las últimas 30.`);
      continue;
    }
    if (invoice.status === "void" || invoice.status === "cancelled") {
      console.log(`Factura ${invoice.numberTemplate.fullNumber} (id ${invoice.id}) ya estaba anulada.`);
      continue;
    }
    await alegraFetch(`/invoices/${invoice.id}/void`, { method: "POST" });
    console.log(`Factura ${invoice.numberTemplate.fullNumber} (id ${invoice.id}) anulada.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
