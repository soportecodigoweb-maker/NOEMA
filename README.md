# NOEMA

> **Tu proceso continúa acompañado.**
> Plataforma de seguimiento terapéutico entre sesiones.

Documento maestro: [`C:/Users/javie/BIBLIA_NOEMA.md`](../../BIBLIA_NOEMA.md)

---

## Qué hay aquí

NOEMA es un **monorepo** que contiene tres aplicaciones y los paquetes compartidos entre ellas.

```
noema/
├── apps/
│   ├── mobile/        → App nativa para pacientes (Expo + React Native)
│   ├── terapeuta/     → Panel web profesional (Next.js 15)
│   └── web/           → Landing + directorio público (Next.js 15)
│
├── packages/
│   ├── ui/            → Tokens NOEMA + componentes
│   ├── database/      → Supabase types + queries
│   ├── config/        → ESLint / TypeScript / Tailwind compartido
│   ├── i18n/          → Textos en español MX
│   └── ai/            → Wrapper Claude con guardrails éticos
│
└── supabase/
    ├── migrations/    → Schema SQL
    ├── functions/     → Edge Functions
    └── seed/          → Datos demo
```

---

## Primeros pasos

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar el archivo de variables de entorno
cp .env.example .env.local

# 3. Iniciar Supabase local (necesita Docker Desktop corriendo)
pnpm supabase:start

# 4. Generar tipos de la base de datos
pnpm supabase:types

# 5. Iniciar todo en desarrollo
pnpm dev
```

### Iniciar solo una app

```bash
pnpm --filter mobile dev       # App paciente (Expo)
pnpm --filter terapeuta dev    # Panel terapeuta (Next.js)
pnpm --filter web dev          # Landing + directorio (Next.js)
```

---

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Mobile:** Expo SDK 52 + React Native + Expo Router
- **Web:** Next.js 15 (App Router) + React 19 + TailwindCSS
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **IA:** Anthropic Claude (con prompt caching) — solo tareas operativas, **nunca diagnóstico**
- **Pagos:** Stripe Subscriptions (post-MVP)
- **Notificaciones:** Expo Push Notifications
- **Hosting:** Vercel (web) + Expo EAS (mobile)

---

## Principios no negociables

1. **La IA nunca reemplaza al terapeuta.** Organiza, resume, facilita. Nunca diagnostica.
2. **Privacidad como gesto, no como casilla.** El paciente decide qué comparte. Siempre.
3. **El módulo de crisis siempre redirige a ayuda real.** Nunca pretende contener una crisis.

Lee la [BIBLIA NOEMA](../../BIBLIA_NOEMA.md) antes de tocar código.

---

## Licencia

Propietario — todos los derechos reservados.
