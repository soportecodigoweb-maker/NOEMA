# syntax=docker/dockerfile:1.7
#
# Multi-stage build para el panel terapeuta NOEMA (Next.js 15 standalone).
#
# Build context: raíz del monorepo (C:/.../noema)
# Build command: docker build -f apps/terapeuta/Dockerfile -t noema-terapeuta .
#
# Imagen final: ~250MB con node:20-alpine + standalone bundle.

# ============================================================================
# Stage 1: deps — instalar TODAS las dependencias del workspace
# ============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# pnpm 9 vía corepack
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copiar lockfile + manifests para que pnpm install pueda cachear deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc* ./
COPY apps/terapeuta/package.json apps/terapeuta/
COPY packages/ui/package.json packages/ui/
COPY packages/database/package.json packages/database/
COPY packages/i18n/package.json packages/i18n/
COPY packages/ai/package.json packages/ai/
COPY packages/config/package.json packages/config/

RUN pnpm install --frozen-lockfile

# ============================================================================
# Stage 2: builder — copiar código y construir
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copiar deps y código fuente. node_modules ya tiene todo (incluyendo workspace links)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables públicas de Supabase (en build time porque Next.js las inlinea)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build solo el panel
RUN pnpm --filter terapeuta build

# ============================================================================
# Stage 3: runner — imagen final, mínima
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/terapeuta/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/terapeuta/.next/static ./apps/terapeuta/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/terapeuta/public ./apps/terapeuta/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/terapeuta/server.js"]
