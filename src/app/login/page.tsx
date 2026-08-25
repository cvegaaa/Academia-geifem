"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/cuenta";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      mode === "login"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name });
    setLoading(false);
    if (result.error) {
      setError(
        mode === "login"
          ? "Correo o contraseña incorrectos."
          : (result.error.message ?? "No se pudo crear la cuenta."),
      );
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={20} />
          </span>
          Academia
        </Link>

        <Card>
          <div className="mb-4 flex rounded-lg bg-surface-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn("flex-1 rounded-md py-1.5", mode === "login" ? "bg-surface shadow-sm" : "text-ink-soft")}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn("flex-1 rounded-md py-1.5", mode === "signup" ? "bg-surface shadow-sm" : "text-ink-soft")}
            >
              Crear cuenta
            </button>
          </div>

          <p className="text-sm text-ink-soft">Accede a tus cursos comprados, o entra para comprar uno nuevo.</p>

          <form onSubmit={submit} className="mt-4 space-y-3">
            {mode === "signup" && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink-soft">Nombre</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-soft">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="input"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink-soft">Contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </label>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Un momento..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
