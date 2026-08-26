"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const urlError = params.get("error");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "No se pudo restablecer la contraseña.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-bold text-ink">
          <Image src="/brand/logo.png" alt="GEIFEM Academy" width={36} height={36} className="rounded-xl" />
          GEIFEM Academy
        </Link>

        <Card>
          <h1 className="text-lg font-bold text-ink">Restablecer contraseña</h1>

          {!token || urlError ? (
            <p className="mt-3 text-sm text-red-500">
              Este enlace no es válido o ya venció. Pide uno nuevo desde{" "}
              <Link href="/login" className="underline">
                inicio de sesión
              </Link>
              .
            </p>
          ) : done ? (
            <>
              <p className="mt-3 text-sm text-ink-soft">Tu contraseña quedó actualizada.</p>
              <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
                Ir a iniciar sesión
              </Button>
            </>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink-soft">Nueva contraseña</span>
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
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
