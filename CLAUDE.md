# Academia

Plataforma de venta de cursos online cortos de ofimática y habilidades laborales, construida por
Vegora — responsabilidad social de GEIFEM Consultoría. Ver
`.claude/skills/arquitectura-academia/SKILL.md` para las decisiones vivas de producto y
arquitectura (leer antes de tocar código).

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `pnpm install` |
| Servidor de desarrollo | `pnpm dev` — http://localhost:3010 (puerto fijo, ver `BETTER_AUTH_URL`) |
| Crear/actualizar un admin | `pnpm exec tsx scripts/create-admin.ts <email> <password> [nombre] [admin\|superadmin\|instructor]` |
| Build | `pnpm build` |
| Typecheck | `pnpm exec tsc --noEmit` |
| Migrar DB | `pnpm run db:migrate` |
| Generar migración | `pnpm run db:generate` |
| Inspeccionar DB | `pnpm run db:studio` |
| Sembrar DB (desde `src/lib/mock-data.ts`) | `pnpm run db:seed` |
| Servicios locales (Postgres) | `docker compose up -d db --wait` · `docker compose down` |

Docker corre dentro de WSL (distro Ubuntu) en esta máquina, no en Docker Desktop para Windows —
si `docker` no se reconoce en PowerShell/Git Bash, ejecutar vía
`wsl -d Ubuntu -e bash -lc "cd '/mnt/c/.../academia' && docker compose ..."`.

**Compuerta:** `pnpm exec tsc --noEmit` debe pasar antes de marcar cualquier tarea como hecha
(no hay lint/tests configurados todavía en este proyecto).

## Stack

Next.js 16 (App Router) · TypeScript ~6.0.3 · Tailwind CSS v4 (identidad visual propia, sin
shadcn instalado) · PostgreSQL 18 · Drizzle ORM 0.45.2 · better-auth 1.7.1 (email + contraseña) ·
ePayco (checkout, credenciales cargadas y probadas contra la API real — ver
arquitectura-academia § Checkout ePayco para el bloqueador de URL pública) · Alegra (facturación
electrónica, conectada y verificada) · Resend (correo, código listo en `src/server/email.ts` —
pendiente solo de que exista la cuenta real, `RESEND_API_KEY` es opcional mientras tanto) ·
Docker Compose autoalojado para Postgres local.

## Entorno

| Variable | Requerida | Usada por |
|---|---|---|
| `DATABASE_URL` | sí | `src/lib/db/index.ts` |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | sí | `src/lib/auth.ts` — `BETTER_AUTH_URL` también arma las URLs de `response`/`confirmation` de ePayco |
| `EPAYCO_PUBLIC_KEY`, `EPAYCO_PRIVATE_KEY` | sí | `src/server/epayco.ts` — crean la sesión de checkout (Apify) |
| `EPAYCO_P_CUST_ID_CLIENTE`, `EPAYCO_P_KEY` | sí | `src/server/epayco.ts` — validan la firma del webhook, par de credenciales **distinto** al anterior |
| `EPAYCO_TEST_MODE` | sí (default `true`) | pasa `test:` al widget de checkout |
| `RESEND_API_KEY` | no (opcional) | `src/server/email.ts` — sin ella, los correos solo quedan logueados, no se envían |
| `RESEND_FROM_EMAIL` | no (default GEIFEM Academy) | remitente de los correos transaccionales |

`.env.example` está committed y sincronizado; `.env` con valores reales nunca lo está.

## Dónde vive cada cosa

| Concepto | Fuente única de verdad |
|---|---|
| Esquema de DB | `src/lib/db/schema.ts` — cambiar aquí, luego `pnpm run db:generate` |
| Acceso a env | `src/lib/env.ts` — validado al arrancar; nunca leer `process.env` en otro lado |
| Sesión de auth | `src/lib/auth.ts` (servidor) / `src/lib/auth-client.ts` (cliente) |
| Datos de mentira (previos a esta fase) | `src/lib/mock-data.ts`, `src/lib/certificate.ts` — siguen
  siendo la fuente para el seed; una vez el admin escriba a la DB de verdad, quedan solo como
  semilla inicial |
| Carrito (mock intencional, pre-checkout) | `src/lib/store.tsx` — solo el carrito sigue en
  `localStorage`; la sesión (`useAuth()` ahí mismo) ya es real, wrapper de `authClient.useSession()` |
| Checkout / pagos | `src/server/epayco.ts` (API de ePayco), `src/server/checkout.ts` (DB:
  enrollments/payments), `src/server/actions/checkout.ts` (Server Action que llama a ambos) |
| Tokens de diseño | Tailwind `@theme` en `src/app/globals.css` |

## Reglas de código

1. Server-first: componentes son Server Components por defecto; `"use client"` solo para estado,
   efectos o manejadores de eventos, en la hoja del árbol.
2. Alias `@/` → `src/`. Sin `../../..`.
3. Dinero siempre en centavos (`integer`), nunca `float`/`numeric`, en DB y en cualquier cálculo
   de backend — convertir a pesos solo al mostrar (`formatCOP` en `src/lib/utils.ts` recibe pesos,
   no centavos; dividir entre 100 al leer de DB).
4. Un componente por archivo, máximo ~300 líneas.
5. Nunca editar a mano una migración ya aplicada — generar una nueva con `db:generate`.
