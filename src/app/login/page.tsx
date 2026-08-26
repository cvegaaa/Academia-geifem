"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/cuenta";
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "forgot") {
      setLoading(true);
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      });
      setLoading(false);
      setForgotSent(true);
      return;
    }

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

    // Un docente no compra cursos — lo mandamos directo a su panel de seguimiento en vez del
    // /cuenta genérico, salvo que ya venga un `next` explícito (ej. desde /carrito).
    const role = (result.data?.user as { role?: string } | undefined)?.role;
    router.push(role === "instructor" && !params.get("next") ? "/instructor" : next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-bold text-ink">
          <Image src="/brand/logo.png" alt="GEIFEM Academy" width={36} height={36} className="rounded-xl" />
          GEIFEM Academy
        </Link>

        <Card>
          {mode !== "forgot" && (
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
          )}

          {mode === "forgot" ? (
            forgotSent ? (
              <p className="text-sm text-ink-soft">
                Si <strong>{email}</strong> tiene una cuenta con nosotros, te enviamos un enlace
                para restablecer tu contraseña. Revisa tu correo.
              </p>
            ) : (
              <p className="text-sm text-ink-soft">
                Escribe tu correo y te enviamos un enlace para restablecer tu contraseña.
              </p>
            )
          ) : (
            <p className="text-sm text-ink-soft">Accede a tus cursos comprados, o entra para comprar uno nuevo.</p>
          )}

          {!(mode === "forgot" && forgotSent) && (
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
              {mode !== "forgot" && (
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
              )}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                  }}
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Un momento..."
                  : mode === "login"
                    ? "Iniciar sesión"
                    : mode === "signup"
                      ? "Crear cuenta"
                      : "Enviar enlace"}
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setForgotSent(false);
                setError(null);
              }}
              className="mt-3 text-xs font-medium text-brand-700 hover:underline"
            >
              ← Volver a iniciar sesión
            </button>
          )}
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
