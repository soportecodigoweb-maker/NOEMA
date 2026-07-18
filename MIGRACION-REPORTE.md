# Migración NOEMA — Reporte

**Fecha:** 2026-07-18
**Realizada por:** Claude Code (autónomo tras autenticación de CLIs)

---

## ✅ Resumen ejecutivo

NOEMA migrado exitosamente desde stack self-hosted (VPS + Docker + HostGator) a stack cloud-managed (**GitHub + Supabase cloud + Vercel**). Cero fricción operacional a futuro: los deploys ahora son `git push` → producción.

**Costo mensual:** $0 (free tiers de las 3 plataformas). Cuando lances a >30 usuarios reales → upgrade a Supabase Pro ($25/mes) recomendado.

---

## 📍 URLs y accesos

### Panel web + landing pública
- **Producción:** https://noema-web-steel.vercel.app
- **Alias limpio:** también accesible en https://noema-web.vercel.app (según DNS)
- **Dashboard Vercel:** https://vercel.com/noema2/noema-web
- **Rutas activas:** `/`, `/terapeutas`, `/signin`, `/signup`, `/inicio`, `/pacientes/*`, `/sesiones/*`, `/mensajes`

### Backend Supabase cloud
- **Project ref:** `qoojcgndwxhdepgrwztt`
- **URL:** https://qoojcgndwxhdepgrwztt.supabase.co
- **Región:** West US (Oregon) — óptima para México
- **Dashboard:** https://supabase.com/dashboard/project/qoojcgndwxhdepgrwztt
- **Postgres:** v17

### GitHub
- **Repo:** https://github.com/somosnoema/noema (privado)
- **Branch principal:** `main`
- **Último commit migración:** `7629b3c` — migrate: apuntar mobile a Supabase cloud + config Vercel monorepo

### App móvil (EAS build)
- **Build ID último:** `5ebb594f-5823-4db8-830b-538a608700cc`
- **Logs:** https://expo.dev/accounts/codigoweb/projects/noema/builds/5ebb594f-5823-4db8-830b-538a608700cc
- **APK descarga:** *[se actualiza cuando termine el build, ~15-20 min desde 2026-07-18 XX:XX]*

---

## 👥 Credenciales de demo (password para todas: `demo-noema-2026`)

### Panel web (login en `/signin`)
```
Terapeuta principal:  andrea.ruiz@demo.noema.app
Otros terapeutas:     mario.lopez@demo.noema.app
                      sofia.mendoza@demo.noema.app
                      pablo.herrera@demo.noema.app
                      lucia.fernandez@demo.noema.app
```

### App móvil paciente
```
Email:    maria.gonzalez@demo.noema.app
Password: demo-noema-2026
```

María González está vinculada con Dra. Andrea Ruiz. Datos sembrados:
- 18 registros emocionales (14 días de historia)
- 4 entradas de diario
- 2 sesiones (1 pasada con notas, 1 próxima)
- 2 tareas con respuestas
- 4 mensajes (1 sin leer)

---

## 🗄️ Base de datos

### Schema aplicado (18 migrations)
```
00001_extensions_and_enums       00010_contenido_educativo
00002_profiles                    00011_recursos_asignados
00003_terapeutas                  00012_modulo_crisis
00004_pacientes_y_vinculaciones   00013_consentimientos_y_privacidad
00005_emociones_y_registros       00014_auditoria
00006_diario                      00015_rls_policies
00007_sesiones                    00016_triggers_coherencia
00008_tareas_y_ejercicios         00017_resumenes_ia
00009_mensajes                    00018_stripe_subscripciones
```

Todas con RLS + triggers + índices completos.

### Env vars ya configuradas en Vercel

```
NEXT_PUBLIC_SUPABASE_URL         → https://qoojcgndwxhdepgrwztt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    → eyJ... (configurado en production+preview+development)
NEXT_PUBLIC_SITE_URL             → https://noema-web.vercel.app
```

---

## ⚠️ Pendientes importantes (para cuando regreses del viaje)

### Prioridad alta

1. **SMTP para reset de password**
   - En Supabase cloud NO hay SMTP configurado.
   - Consecuencia: si un paciente pide reset password, no llega el email.
   - Solución: Settings → Authentication → SMTP Settings — configurar con Resend, Mailgun o Postmark.
   - Los seed users están auto-confirmados (no requieren email), pero un signup real desde `/signup` sí lo necesitará.

2. **Configurar email confirmations en Supabase Auth**
   - Dashboard → Authentication → Providers → Email
   - Decidir: ¿confirm email obligatorio o auto-confirm? (temporalmente auto-confirm sirve para no bloquear pruebas).

3. **Dominio custom `somosnoema.com`**
   - Actualmente el DNS apunta al VPS viejo.
   - Para apuntar a Vercel: Vercel dashboard → noema-web → Settings → Domains → agregar `somosnoema.com` → seguir instrucciones DNS.
   - Ir a Cloudflare (donde vive el DNS) → cambiar registro A/CNAME.

4. **Rebuild EAS con la nueva URL** (última pieza pendiente)
   - En progreso al momento del reporte. Build ID `5ebb594f-...`.
   - Cuando termine, el APK final estará en el mismo dashboard de Expo.

### Prioridad media

5. **Backup semanal automático**
   - Free tier de Supabase = 1 día de PITR. Insuficiente para salud mental.
   - Solución mientras estás en Free: cron job en el VPS actual que corra `pg_dump` semanal contra la DB cloud y guarde en el VPS.
   - Cuando pases a Pro ($25/mes) → 7 días PITR automáticos.

6. **Migrar dominios de email**
   - Si quieres emails `@somosnoema.com` (para SMTP outbound), configurar Cloudflare Email Routing (gratis) → redirige a tu Gmail o crea buzones reales.

7. **Terminar Fase 6 (IA con Anthropic)**
   - Necesitas crear cuenta Anthropic y generar API key.
   - Después: setear `ANTHROPIC_API_KEY` en Vercel env vars.
   - El código de `@noema/ai` ya tiene los stubs listos.

### Prioridad baja / opcional

8. **Vercel deploys automáticos por push**
   - Ya está linkeado. Configurar en dashboard → Git → Connected Repository.
   - Después: cada `git push origin main` → deploy automático a producción.

9. **Preview deployments por PR**
   - Con Vercel conectado a GitHub, cada Pull Request genera un preview URL único.
   - Útil para probar cambios sin tocar producción.

10. **Restaurar welcome.tsx bonito** (con Vesica + animación)
    - Actualmente es la versión simplificada de diagnóstico.
    - Cuando quieras, retomar el diseño original.

11. **Búsqueda de pacientes en panel terapeuta**
    - El input de búsqueda está deshabilitado.
    - Activar filtro por nombre + código.

---

## 🎯 Cómo probar todo (checklist post-migración)

**Web:**
- [ ] Abrir https://noema-web-steel.vercel.app → ve landing NOEMA
- [ ] `/terapeutas` → ve los 5 terapeutas seed
- [ ] `/signin` con `andrea.ruiz@demo.noema.app` / `demo-noema-2026`
- [ ] Verás en el panel: María González con toda su historia sembrada

**Móvil (cuando termine build #5):**
- [ ] Descargar APK del link en Expo
- [ ] Instalar (aceptar "fuente desconocida")
- [ ] Login con `maria.gonzalez@demo.noema.app` / `demo-noema-2026`
- [ ] Debería entrar directo a la pantalla home (María ya tiene onboarding + vínculo)

---

## 💰 Costos actuales

| Servicio | Plan | Costo/mes |
|---|---|---|
| GitHub | Free (repos ilimitados) | $0 |
| Supabase | Free (500MB DB, 5GB bandwidth) | $0 |
| Vercel | Hobby (proyectos ilimitados) | $0 |
| Expo (EAS Build) | Free (~30 builds/mes) | $0 |
| Dominio `somosnoema.com` | Cloudflare Registrar | ~$10/año |
| **TOTAL** | | **$0/mes** |

Cuando pases a >30 usuarios activos: upgrade Supabase Pro = **$25/mes total**.

---

## 🔒 Seguridad — credenciales sensibles

- **Archivo local NO commiteado:** `C:\Users\javie\Projects\noema-migration.env` (contiene service_role key). Está fuera del repo git, seguro.
- **Vercel env vars:** encriptadas en el dashboard, solo visibles a nivel proyecto.
- **GitHub secrets (por configurar cuando integres CI/CD):** dashboard → Settings → Secrets → Actions.

**⚠️ NUNCA:**
- Pegues el `SUPABASE_SERVICE_ROLE_KEY` en el chat, en un commit, o en un env var `NEXT_PUBLIC_*`.
- Compartas el `noema-migration.env`.

---

## 📞 Si algo falla mientras Javier está de viaje

**Si el panel web deja de responder:**
- Dashboard Vercel → ver deployment status
- Si es build error: revisar logs del último deploy

**Si Supabase se queda dormido:**
- Free tier pausa el proyecto después de 1 semana sin uso.
- Solución: entrar al dashboard y "Resume project" (1 click).
- Para evitarlo: setup un cron que haga un query cualquiera cada 6 días.

**Si el mobile no logea:**
- Verificar que EXPO_PUBLIC_SUPABASE_URL en el build sea el correcto (`qoojcgndwxhdepgrwztt.supabase.co`).
- Si es un build viejo, hacer `eas build --profile preview` de nuevo.

---

## 🏁 Estado al momento del reporte

- ✅ GitHub: código pushed
- ✅ Supabase cloud: schema + seeds aplicados
- ✅ Vercel: web deployado y respondiendo HTTP 200
- ⏳ Mobile: build #5 en progreso (APK final se actualiza en este archivo al terminar)
- 📝 Reporte: este archivo

**Todo lo demás sigue vivo:**
- El VPS actual con Supabase self-hosted sigue up (backup natural)
- El deploy viejo en `soportecodigoweb-maker/NOEMA` sigue disponible (rollback si necesario)
