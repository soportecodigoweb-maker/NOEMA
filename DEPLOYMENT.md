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

## 3b. Notificaciones push (Expo)

Cómo funciona: cada fila nueva en `notificaciones` (mensaje del terapeuta, tarea asignada, recordatorio de registro, alerta de crisis…) dispara el trigger `enviar_push_notificacion`, que manda la notificación con `pg_net` a la API de Expo (`exp.host`) para todos los dispositivos del destinatario guardados en `push_tokens`. La app registra su token al entrar y lo borra al cerrar sesión. Un job horario (`limpiar_push_tokens_horario`) borra los tokens que Expo reporta como `DeviceNotRegistered`.

El código ya está listo; lo que falta son **credenciales**, que no se commitean:

### a) Base de datos

```bash
supabase db push   # aplica 20260917120000_push_activar.sql (habilita pg_net y pg_cron)
```

Verifica en el SQL Editor que existen:

```sql
select extname from pg_extension where extname in ('pg_net', 'pg_cron');
select jobname from cron.job where jobname = 'limpiar_push_tokens_horario';
```

En Supabase **self-hosted**, la imagen `supabase/postgres` ya trae ambas extensiones precargadas. Si `pg_net` no aparece, revisa que `shared_preload_libraries` incluya `pg_net` y reinicia la BD.

### b) Android — Firebase Cloud Messaging (FCM V1)

1. Crea un proyecto en https://console.firebase.google.com y añade una app Android con el paquete `app.noema.mobile`.
2. Descarga `google-services.json` y guárdalo como variable de EAS tipo archivo (así no entra al repo):

```bash
cd apps/mobile
eas env:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production
eas env:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment preview
```

   `app.config.js` lo engancha automáticamente. Para builds locales, deja el archivo en `apps/mobile/google-services.json` (está en `.gitignore`).

3. En Firebase → Configuración del proyecto → Cuentas de servicio → **Generar nueva clave privada** (JSON), y súbela a EAS:

```bash
eas credentials --platform android
# → production → Google Service Account → Manage your Google Service Account Key for Push Notifications (FCM V1) → Set up
```

### c) iOS — APNs

```bash
eas credentials --platform ios
# → production → Push Notifications: Manage your Apple Push Notifications Key → Set up a new key
```

EAS crea y sube la clave APNs con tu cuenta de Apple Developer. No hace falta ningún archivo en el repo.

### d) Token de acceso de Expo (recomendado)

Evita que alguien con tus tokens de dispositivo mande push haciéndose pasar por NOEMA. En https://expo.dev → Account settings → Access tokens crea uno y, en **Project settings → Push notifications**, activa "Enhanced Security". Luego guárdalo en la BD:

```sql
alter database postgres set app.settings.expo_access_token = 'expo_xxx';
```

### e) Probar

1. Haz un build con `eas build --profile preview` e instálalo en un teléfono real (en simulador/Expo Go no hay push).
2. Inicia sesión como paciente y acepta el permiso. Confirma que hay una fila en `push_tokens`.
3. Desde el panel del terapeuta mándale un mensaje. Debe sonar en el teléfono y, al tocarlo, abrir la pantalla de mensajes.
4. Si no llega: mira las respuestas de Expo en `select status_code, content from net._http_response order by id desc limit 5;`. Un `DeviceNotRegistered` significa credenciales FCM/APNs faltantes o token de otro build.

Preferencias que ya se respetan: los toggles de **Ajustes → Mis notificaciones** y **No molestar** del terapeuta (en ese horario llegan sin sonido, salvo crisis) y **Notificaciones al paciente** por vinculación.

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
| `GOOGLE_SERVICES_JSON` (archivo) | Mobile EAS (push Android) | Firebase → Configuración del proyecto → tu app Android |
| `app.settings.expo_access_token` (ajuste de BD) | Trigger `enviar_push_notificacion` | expo.dev → Account settings → Access tokens |

---

## 6b. Despliegue automático del panel (GitHub Actions → VPS)

Cada push a `main` que toque `apps/terapeuta/`, `packages/` o el lockfile ejecuta
`.github/workflows/deploy-panel.yml`: entra por SSH al VPS, respalda `/opt/noema/source`,
sube el árbol con `git archive | tar`, reconstruye solo `noema-panel` y comprueba que
`https://app.somosnoema.com/signin` responde 200. También se puede lanzar a mano desde
GitHub → Actions → "Desplegar panel al VPS" → Run workflow.

Activación (una sola vez):

1. Genera una llave SSH dedicada al flujo, sin passphrase (en cualquier máquina):

```bash
ssh-keygen -t ed25519 -C "github-actions-noema" -f ./noema-deploy -N ""
```

2. Autoriza la pública en el VPS (una línea nueva en `/root/.ssh/authorized_keys`):

```bash
cat ./noema-deploy.pub | ssh hostgator-vps "cat >> /root/.ssh/authorized_keys"
```

3. En GitHub → repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Valor |
|---|---|
| `VPS_HOST` | `69.6.207.91` |
| `VPS_PORT` | `22022` |
| `VPS_SSH_KEY` | el contenido COMPLETO del archivo `noema-deploy` (la privada, con las líneas BEGIN/END) |

4. Borra `noema-deploy` y `noema-deploy.pub` de la máquina donde los generaste.

Lo que el flujo NO hace: aplicar migraciones de Supabase (siguen siendo manuales, y el job
avisa cuando el push trae alguna) ni tocar otros contenedores del VPS.

---

## 6c. Demo público (video demo + sandbox por visitante)

El demo de ventas vive en el mismo dominio que la app y no necesita cuenta:

| Ruta | Qué es |
|---|---|
| `/web` | Página web pública con la entrada a los dos demos |
| `/demo/psicologo` y `/demo/paciente` | Hub por rol: Video demo y Cuenta demo |
| `/demo/video/psicologo` y `/demo/video/paciente` | Reproductor de 12 y 11 diapositivas con la app real dentro |
| `/demo/entrar?rol=…&a=…` | Crea al visitante (dos cuentas demo + historia) y abre sus dos sesiones |
| `/demo/reiniciar` (POST), `/demo/salir`, `/demo/estado` | Reiniciar la historia, salir del demo, ids para el recorrido |

**Cómo funciona.** Cada visitante recibe su propia pareja de cuentas reales (psicóloga demo +
paciente demo, más tres pacientes de relleno) creadas en la base con `demo_crear_visitante()`
(migración `20260926120000_demo_publico.sql`). Las dos sesiones viven a la vez en cookies
distintas (`sb-noema-auth` para la psicóloga, `sb-noema-dpac` para el paciente, que solo se usa
en rutas `/paciente`), por eso el panel puede mostrar el teléfono del paciente en un iframe y el
video puede tener laptop y teléfono a la vez. Los perfiles demo llevan `profiles.demo_visitante`;
con eso los layouts montan la capa del demo (tira, recorrido) y esconden los avisos de producto.

**Reinicio.** "Reiniciar demo" vuelve a sembrar la historia del visitante (`demo_reiniciar`). El
job de pg_cron `demo_reinicio_nocturno` corre a las 03:00 CDMX (`0 9 * * *` UTC) y borra a todos
los visitantes del día (`demo_limpiar(0)`), cuentas incluidas. Freno de abuso: 200 visitantes
nuevos por hora.

**Activar en producción.**

1. Aplicar la migración en el VPS (a mano, como siempre):
   ```bash
   docker exec -i supabase-db psql -U postgres -d postgres < supabase/migrations/20260926120000_demo_publico.sql
   ```
2. Comprobar que el job quedó programado y probar la creación de un visitante:
   ```sql
   select jobname, schedule from cron.job where jobname = 'demo_reinicio_nocturno';
   select public.demo_crear_visitante(gen_random_uuid(), 'prueba-temporal', null);
   select public.demo_limpiar(0);   -- borra la prueba
   ```
3. El panel ya usa `SUPABASE_SERVICE_ROLE_KEY` del `.env` del VPS para llamar a esas funciones;
   no hace falta ninguna variable nueva.
4. Abrir `https://app.somosnoema.com/signin` y probar los tres botones.

**Textos que se editan sin tocar código:** precio del video (`apps/terapeuta/src/lib/demo/precio.ts`),
guiones del recorrido (`src/lib/demo/recorrido-*.ts`) y diapositivas (`src/lib/demo/video-*.ts`).

---

## 7. Checklist pre-lanzamiento

- [ ] Migraciones aplicadas en Supabase Cloud
- [ ] Edge Functions desplegadas y respondiendo (prueba con curl)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Webhook de Stripe configurado y validado (Stripe te muestra "succeeded")
- [ ] Dominio apuntando a Vercel y certificado SSL emitido
- [ ] Push: credenciales FCM V1 (Android) y APNs (iOS) cargadas en EAS; mensaje de prueba recibido en un teléfono real (sección 3b)
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
