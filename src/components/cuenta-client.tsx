"use client";

import Link from "next/link";
import { CheckCircle2, LogOut, ShoppingCart } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BillingInfoForm } from "@/components/billing-info-form";
import { Badge, Button, Card } from "@/components/ui";
import { useAuth, useCart } from "@/lib/store";
import { formatCOP } from "@/lib/utils";
import type { Course } from "@/lib/types";

export function CuentaClient({
  loggedIn,
  nombre,
  email,
  identificationType,
  identificationNumber,
  misCursos,
  disponibles,
}: {
  loggedIn: boolean;
  nombre: string;
  email: string;
  identificationType: string | null;
  identificationNumber: string | null;
  misCursos: Course[];
  disponibles: Course[];
}) {
  const auth = useAuth();
  const cart = useCart();

  if (!loggedIn) {
    return (
      <div>
        <SiteHeader />
        <section className="mx-auto max-w-md px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-ink">Aún no has iniciado sesión</h1>
          <p className="mt-2 text-ink-soft">
            Inicia sesión para ver tus cursos comprados, o para comprar uno nuevo desde aquí.
          </p>
          <Link href="/login?next=/cuenta">
            <Button className="mt-6">Iniciar sesión</Button>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Hola, {nombre}</h1>
            <p className="text-sm text-ink-soft">{email}</p>
          </div>
          <button
            onClick={auth.logout}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>

        <BillingInfoForm identificationType={identificationType} identificationNumber={identificationNumber} />

        <h2 className="mb-4 text-lg font-bold text-ink">Mis cursos</h2>
        {misCursos.length === 0 ? (
          <Card className="mb-10 text-center text-ink-soft">Todavía no has comprado ningún curso.</Card>
        ) : (
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {misCursos.map((c) => (
              <Card key={c.slug}>
                <Badge tone={c.seccionId ? "brand" : "neutral"}>{c.seccionNombre}</Badge>
                <p className="mt-2 font-semibold text-ink">{c.titulo}</p>
                <Link href={`/estudiante/${c.slug}`}>
                  <Button variant="secondary" className="mt-4 w-full">
                    Seguir aprendiendo
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {disponibles.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">
                {misCursos.length > 0 ? "Sigue aprendiendo: más cursos" : "Comprar tu primer curso"}
              </h2>
              <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">
                Ver catálogo completo
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {disponibles.map((c) => (
                <Card key={c.slug}>
                  <Badge tone={c.seccionId ? "brand" : "neutral"}>{c.seccionNombre}</Badge>
                  <p className="mt-2 font-semibold text-ink">{c.titulo}</p>
                  <p className="mt-1 text-sm text-ink-soft">{formatCOP(c.precio)}</p>
                  <Button
                    variant={cart.has(c.slug) ? "ghost" : "primary"}
                    className="mt-4 w-full"
                    onClick={() => cart.add(c)}
                    disabled={cart.has(c.slug)}
                  >
                    <ShoppingCart size={16} />
                    {cart.has(c.slug) ? "✓ En el carrito" : "Agregar al carrito"}
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        {cart.items.length > 0 && (
          <Card className="mt-8 flex items-center justify-between border-brand-200 bg-brand-50">
            <p className="flex items-center gap-2 text-sm font-medium text-brand-800">
              <CheckCircle2 size={16} /> Tienes {cart.items.length} curso(s) en el carrito
            </p>
            <Link href="/carrito">
              <Button>Ir al carrito</Button>
            </Link>
          </Card>
        )}
      </section>
    </div>
  );
}
