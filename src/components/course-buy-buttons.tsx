"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui";
import type { Course } from "@/lib/types";
import { useCart } from "@/lib/store";

export function CourseBuyButtons({ course }: { course: Course }) {
  const cart = useCart();
  const router = useRouter();
  const inCart = cart.has(course.slug);

  function comprarAhora() {
    cart.add(course);
    router.push("/carrito");
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" onClick={comprarAhora}>
        Comprar ahora
      </Button>
      <Button
        variant={inCart ? "ghost" : "secondary"}
        className="w-full"
        onClick={() => cart.add(course)}
        disabled={inCart}
      >
        <ShoppingCart size={16} />
        {inCart ? "✓ En el carrito" : "Agregar al carrito"}
      </Button>
    </div>
  );
}
