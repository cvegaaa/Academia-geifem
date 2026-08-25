"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button, Card } from "@/components/ui";
import { useCart } from "@/lib/store";

// Página de "response" de ePayco — solo informativa. La confirmación real (marcar la matrícula
// como pagada) la hace el webhook server-to-server en /api/webhooks/epayco, nunca esta página.
export default function ConfirmacionPage() {
  const cart = useCart();

  useEffect(() => {
    cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <SiteHeader />
      <section className="mx-auto max-w-md px-6 py-16 text-center">
        <CheckCircle2 size={40} className="mx-auto text-brand-600" />
        <h1 className="mt-4 text-2xl font-bold text-ink">¡Gracias por tu compra!</h1>
        <p className="mt-2 text-ink-soft">
          Estamos confirmando tu pago con ePayco — puede tardar unos segundos. En cuanto se
          confirme, tu curso aparece en "Mis cursos".
        </p>
        <Link href="/cuenta">
          <Button className="mt-6">Ir a mi cuenta</Button>
        </Link>
      </section>
    </div>
  );
}
