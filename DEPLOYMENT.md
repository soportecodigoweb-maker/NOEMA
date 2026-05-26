# NOEMA — Guía de despliegue a producción

Esta guía te lleva paso por paso desde "todo funciona local" hasta "los pacientes pueden descargar la app y los terapeutas pagan con Stripe real".

---

## Componentes a desplegar

| Componente | Dónde | Costo aproximado |
|---|---|---|
| Backend (DB + Auth + Storage + Edge Functions) | **Supabase Cloud** | Free hasta 50k MAU |
| Panel terapeuta (Next.js) | **Vercel** | Free para empezar |
| App móvil (iOS/Android) | **EAS Build + App Store + Google Play** | $99/año Apple, $25 único Google |
| Dominio (`noema.app`) | Cualquier registrar (Namecheap, Cloudflare) | ~$200 MXN/año |
| Stripe (cobros) | Stripe directo | 3.6% + $3 MXN por transacción |
| IA (resúmenes) | Anthropic API | ~$0.003 USD por resumen |

---

## 1. Supabase a producción

```bash
# 1. Crea un proyecto en https://supabase.com/dashboard
# 2. Anota el Project Ref y la URL

# 3. Conecta tu CLI local al proyecto remoto
cd C:\Users\javie\Projects\noema
supabase link --project-ref TU_PROJECT_REF

# 4. Aplica TODAS las migraciones a producción
supabase db push

# 5. Configura los secrets para las Edge Functions
supabase secrets set ANTHROPIC_API_KEY=sk-ant-tu-key-real
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_PRICE_ID_PACIENTE=price_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set NEXT_PUBLIC_SITE_URL=https://noema.app

# 6. Despliega las Edge Functions
supabase functions deploy generar-resumen
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

**Anota** la URL del proyecto y la Anon Key (Settings → API).

---

## 2. Panel terapeuta a Vercel

```bash
# Desde la raíz del monorepo
cd apps/terapeuta
npx vercel
# Elige: Link to existing project? No. Project name: noema-terapeuta.
# Framework: Next.js (autodetect). Root: ./
```

En el dashboard de Vercel, agrega las **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
NEXT_PUBLIC_SITE_URL=https://app.noema.app
```

Conecta tu dominio (Settings → Domains → `app.noema.app`).

---

## 3. App móvil con EAS Build

```bash
# Instala EAS CLI
npm install -g eas-cli

# Login con tu cuenta Expo
eas login

cd apps/mobile

# Configura el proyecto (te pide que crees un projectId)
eas init

# Edita eas.json: pon tu URL de Supabase real en build.production.env
# Edita app.json: cambia bundleIdentifier si quieres (default app.noema.mobile)

# Build de desarrollo (instalable directo en tu celular)
eas build --profile development --platform android

# Build de producción
eas build --profile production --platform ios
eas build --profile production --platform android

# Sube a las stores
eas submit --platform ios   # primero apple developer account
eas submit --platform android  # primero google play console
```

**Antes del primer submit:** necesitas crear las apps en App Store Connect y Google Play Console manualmente, completar la ficha (iconos, screenshots, descripción, clasificación de edad, política de privacidad URL → `https://app.noema.app/privacidad`).

---

## 4. Stripe — pasos críticos

### Configurar producto y precio
1. Stripe Dashboard → Products → New Product
2. Nombre: "NOEMA · Paciente activo"
3. Pricing: Recurring · Monthly · $100.00 MXN · per_unit · quantity adjustable
4. Anota el **price_id** (`price_xxx`)

### Configurar webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://TU_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
3. Events: marca `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
4. Anota el **signing secret** (`whsec_xxx`) → ponlo en los secrets de Supabase (`STRIPE_WEBHOOK_SECRET`)

### Probar checkout
Desde el panel del terapeuta → Ajustes → "Iniciar prueba premium". Te lleva a Stripe Checkout. Usa tarjeta de prueba `4242 4242 4242 4242` (cualquier expiración futura, cualquier CVC).

---

## 5. Dominio

Compra `noema.app` (recomendado por el "app" en el TLD que da claridad).

Configuración DNS típica:

```
app.noema.app    → CNAME → cname.vercel-dns.com  (panel)
www.noema.app    → CNAME → cname.vercel-dns.com  (landing futura)
noema.app        → A     → 76.76.21.21           (landing futura)
```

---

## 6. Variables sensibles — resumen

| Variable | Dónde se usa | De dónde sale |
|---|---|---|
| `ANTHROPIC_API_KEY` | Edge Function `generar-resumen` | console.anthropic.com → Settings → API Keys |
| `STRIPE_SECRET_KEY` | Edge Functions `stripe-*` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PRICE_ID_PACIENTE` | Edge Function `stripe-checkout` | Stripe Dashboard → Products |
| `STRIPE_WEBHOOK_SECRET` | Edge Function `stripe-webhook` | Stripe Dashboard → Webhooks → tu endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + Supabase functions | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + Mobile EAS | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + Mobile EAS | Supabase → Settings → API (Publishable) |

---

## 7. Checklist pre-lanzamiento

- [ ] Migraciones aplicadas en Supabase Cloud
- [ ] Edge Functions desplegadas y respondiendo (prueba con curl)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Webhook de Stripe configurado y validado (Stripe te muestra "succeeded")
- [ ] Dominio apuntando a Vercel y certificado SSL emitido
- [ ] App Store Connect y Google Play Console con la app aprobada
- [ ] Política de privacidad pública y enlazada en App Store + Google Play
- [ ] Primera prueba end-to-end real: alta de terapeuta → vincular paciente real → registro → resumen IA → cobro Stripe

---

## Costos mensuales estimados para 50 terapeutas activos

| Concepto | Costo |
|---|---|
| Supabase Pro | $25 USD |
| Vercel Pro | $20 USD |
| Anthropic API (~500 resúmenes/mes) | ~$5 USD |
| Stripe fees (~$100 × 50 = $5000 MXN ingreso) | ~$200 MXN |
| Dominio (anualizado) | ~$20 MXN |
| Apple Developer (anualizado) | ~$170 MXN |
| **Total mensual aprox** | **~$1200 MXN** |
| **Ingreso mensual aprox** | **$5000 MXN** |
| **Margen** | **~76%** |
