"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, Tag, Trash2, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button, Card } from "@/components/ui";
import { useEpaycoCheckout } from "@/components/epayco-checkout";
import { startCheckoutAction } from "@/server/actions/checkout";
import { previewCouponAction } from "@/server/actions/coupons";
import { useAuth, useCart } from "@/lib/store";
import { formatCOP } from "@/lib/utils";

const COUPON_ERRORS: Record<string, string> = {
  not_found: "Ese código no existe.",
  inactive: "Ese cupón ya no está activo.",
  expired: "Ese cupón ya venció.",
  usage_limit_reached: "Ese cupón ya alcanzó su límite de usos.",
};

export default function CarritoPage() {
  const cart = useCart();
  const auth = useAuth();
  const router = useRouter();
  const openCheckout = useEpaycoCheckout();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsIdentification, setNeedsIdentification] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ codigo: string; discountCents: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotalCents = Math.round(cart.total * 100);
  const discountCents = couponApplied?.discountCents ?? 0;
  const totalCents = Math.max(subtotalCents - discountCents, 0);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    const result = await previewCouponAction(couponInput.trim(), subtotalCents);
    setCouponLoading(false);
    if (!result.ok) {
      setCouponError(COUPON_ERRORS[result.error] ?? "No se pudo aplicar el cupón.");
      setCouponApplied(null);
      return;
    }
    setCouponApplied({ codigo: result.codigo, discountCents: result.discountCents });
    setCouponInput("");
  }

  function removeCoupon() {
    setCouponApplied(null);
    setCouponError(null);
  }

  async function pagar() {
    if (!auth.user) {
      router.push("/login?next=/carrito");
      return;
    }
    setLoading(true);
    setError(null);
    setNeedsIdentification(false);
    const result = await startCheckoutAction(cart.items.map((i) => i.slug), couponApplied?.codigo);
    setLoading(false);
    if (!result.ok) {
      if (result.error === "not_authenticated") {
        setError("Tu sesión expiró, inicia sesión de nuevo.");
      } else if (result.error === "missing_identification") {
        setError("Falta tu documento de identidad para poder facturar — complétalo en tu cuenta.");
        setNeedsIdentification(true);
      } else if (result.error === "El cupón ya no es válido") {
        setError("El cupón ya no es válido — quítalo e intenta de nuevo.");
        setCouponApplied(null);
      } else {
        setError("No se pudo iniciar el pago. Intenta de nuevo.");
      }
      return;
    }
    await openCheckout(result.sessionId, result.testMode);
  }

  return (
    <div>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-ink">
          <ShoppingCart size={24} /> Tu carrito
        </h1>

        {cart.items.length === 0 ? (
          <Card className="text-center">
            <p className="text-ink-soft">Tu carrito está vacío.</p>
            <Link href="/">
              <Button className="mt-4">Explorar cursos</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <Card key={item.slug} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">{item.titulo}</p>
                    <p className="text-sm text-ink-soft">{formatCOP(item.precio)}</p>
                  </div>
                  <button
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    onClick={() => cart.remove(item.slug)}
                  >
                    <Trash2 size={18} />
                  </button>
                </Card>
              ))}
            </div>

            <Card className="mt-6">
              {couponApplied ? (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-brand-700">
                    <Tag size={14} /> {couponApplied.codigo} aplicado
                  </span>
                  <button onClick={removeCoupon} className="text-brand-700 hover:text-brand-800">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                      placeholder="Código de descuento"
                      className="input flex-1 font-mono uppercase"
                    />
                    <Button variant="secondary" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}>
                      {couponLoading ? <Loader2 size={16} className="animate-spin" /> : "Aplicar"}
                    </Button>
                  </div>
                  {couponError && <p className="mt-2 text-sm text-red-500">{couponError}</p>}
                </div>
              )}

              {couponApplied && (
                <div className="mb-2 flex items-center justify-between text-sm text-ink-soft">
                  <span>Subtotal</span>
                  <span>{formatCOP(Math.round(subtotalCents / 100))}</span>
                </div>
              )}
              {couponApplied && (
                <div className="mb-2 flex items-center justify-between text-sm text-brand-700">
                  <span>Descuento</span>
                  <span>-{formatCOP(Math.round(discountCents / 100))}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-bold text-ink">
                <span>Total</span>
                <span>{formatCOP(Math.round(totalCents / 100))}</span>
              </div>
              {error && (
                <p className="mt-3 text-sm text-red-500">
                  {error}{" "}
                  {needsIdentification && (
                    <Link href="/cuenta" className="font-semibold underline">
                      Ir a mi cuenta
                    </Link>
                  )}
                </p>
              )}
              <Button className="mt-4 w-full" onClick={pagar} disabled={loading}>
                {loading ? "Preparando pago..." : auth.user ? "Ir a pagar" : "Iniciar sesión para pagar"}
              </Button>
              <p className="mt-3 text-center text-xs text-ink-soft">Pago seguro vía ePayco · PSE, tarjeta, Davivienda</p>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
