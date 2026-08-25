"use client";

// Carrito de mentira (localStorage, pre-checkout) — normal incluso con backend real, ver
// arquitectura-academia § Pagos. La sesión de usuario YA NO es de mentira: usa better-auth de
// verdad vía useAuth() más abajo.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { Course } from "@/lib/types";

export interface CartItem {
  slug: string;
  titulo: string;
  precio: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (course: Course) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage("academia:cart", []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("academia:cart", JSON.stringify(items));
  }, [items, hydrated]);

  const cartValue: CartContextValue = {
    items,
    add: (course) =>
      setItems((prev) =>
        prev.some((i) => i.slug === course.slug)
          ? prev
          : [...prev, { slug: course.slug, titulo: course.titulo, precio: course.precio }],
      ),
    remove: (slug) => setItems((prev) => prev.filter((i) => i.slug !== slug)),
    clear: () => setItems([]),
    has: (slug) => items.some((i) => i.slug === slug),
    total: items.reduce((sum, i) => sum + i.precio, 0),
  };

  return <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de AppStoreProvider");
  return ctx;
}

/** Sesión real de better-auth — reemplaza el store de mentira usado en la primera vuelta visual. */
export function useAuth() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  return {
    user: data?.user ? { nombre: data.user.name, email: data.user.email } : null,
    isPending,
    logout: async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    },
  };
}
