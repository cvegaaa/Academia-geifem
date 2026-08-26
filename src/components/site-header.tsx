"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useAuth, useCart } from "@/lib/store";

export function SiteHeader() {
  const { items } = useCart();
  const { user } = useAuth();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <Image src="/brand/logo.png" alt="GEIFEM Academy" width={36} height={36} className="rounded-lg" />
          <span>GEIFEM Academy</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-ink-soft">
          <Link href="/" className="hover:text-ink">
            Cursos
          </Link>
          <Link href="/#becas" className="hover:text-ink">
            Becas GEIFEM
          </Link>
          <Link href="/carrito" className="relative flex items-center gap-1.5 hover:text-ink">
            <ShoppingCart size={18} />
            {items.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                {items.length}
              </span>
            )}
          </Link>
          <Link
            href="/cuenta"
            className="flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-100"
          >
            <User size={16} />
            {user ? user.nombre : "Iniciar sesión"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
