# Imagen de producción para GEIFEM Academy — build multi-stage con salida "standalone" de Next.js.

FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Las env vars reales de runtime se inyectan al arrancar el contenedor (ver docker-compose /
# service env) — estas son solo placeholders para que `next build` no falle validando el schema
# de src/lib/env.ts durante el build (no se usan en producción).
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV BETTER_AUTH_SECRET="placeholder-build-time-secret-not-used-at-runtime"
ENV BETTER_AUTH_URL="http://localhost:3010"
ENV EPAYCO_PUBLIC_KEY="placeholder"
ENV EPAYCO_PRIVATE_KEY="placeholder"
ENV EPAYCO_P_CUST_ID_CLIENTE="placeholder"
ENV EPAYCO_P_KEY="placeholder"
ENV ALEGRA_API_TOKEN="placeholder"
ENV ALEGRA_ITEM_ID_CURSO="placeholder"
ENV ALEGRA_NUMBER_TEMPLATE_ID="placeholder"
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3010
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
