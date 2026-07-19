# NOEMA — Estado de requerimientos

**Última actualización:** 2026-07-18 (sesión autónoma)
**Repo:** https://github.com/somosnoema/noema · **DB:** Supabase cloud `qoojcgndwxhdepgrwztt`

Este documento cubre DOS conjuntos de requerimientos:
- **Parte 1:** 13 funciones del TERAPEUTA (más abajo)
- **Parte 2:** 11 funciones del PACIENTE (al final, sección "FUNCIONES DEL PACIENTE")

---

## Leyenda
- ✅ **Hecho y verificado** — funciona end-to-end, probado en navegador
- 🟡 **Parcial** — base construida, falta completar
- 🔴 **Pendiente** — no iniciado o requiere tu decisión (API keys, precios, revisión clínica)

---

## Resumen por requerimiento

| # | Requerimiento | Estado |
|---|---|---|
| 1 | Info del paciente en tiempo real | 🟡 Parcial (datos llegan, falta realtime instantáneo) |
| 2 | Retroalimentar con push + IA | 🔴 Pendiente (mensajes existen; falta push + IA) |
| 3 | Plantillas, forms, PDFs, fecha límite | 🟡 Parcial (7 plantillas ✅ + fecha límite en DB; falta form builder + PDF) |
| 4 | Métricas + historial NOM-004 | 🟡 Parcial (KPIs básicos; falta historial completo) |
| 5 | Notas + adjuntos + inmutabilidad | 🟡 Parcial (notas ✅; falta adjuntos + inmutabilidad) |
| 6 | IA por voz + control por voz | 🔴 Pendiente (requiere tu cuenta OpenAI) |
| 7 | Código para vincular paciente | ✅ **Ya existía y funciona** |
| 8 | Colores por riesgo + filtro | ✅ **Hecho y verificado** |
| 9 | Habilitar/deshabilitar botón SOS | ✅ **Hecho y verificado** |
| 10 | Pagos recurrentes + efectivo manual | 🔴 Pendiente (requiere setup Stripe + precios) |
| 11 | Dashboard financiero admin | 🔴 Pendiente (depende de #10) |
| 12 | Aviso de confidencialidad | ✅ **Hecho y verificado** (lado terapeuta) |
| 13 | Toggle agenda por paciente | ✅ **Hecho y verificado** |

**Completados esta sesión: #7, #8, #9, #12, #13 + base sólida de #3.**

---

## Detalle de lo hecho esta sesión

### ✅ #8 — Nivel de riesgo con colores y filtro
- Migration `00021`: enum `nivel_riesgo` (sin_evaluar/bajo/medio/alto/crítico) en `vinculaciones`.
- Lista de pacientes rehecha con indicador de color por paciente, badge de nivel, filtro por riesgo, orden por gravedad.
- Selector de riesgo en la ficha del paciente (popover). **Verificado:** asignar "alto" persiste en DB y se refleja en la lista.
- **Bonus:** activé el buscador de pacientes (estaba deshabilitado) — filtra por nombre y código.

### ✅ #9 — Botón S.O.S. habilitable
- Toggle en la ficha del paciente (control del terapeuta).
- App mobile: hook `useSosHabilitado` — el `CrisisButton` se oculta si el terapeuta lo desactiva. Default `true` (seguridad).

### ✅ #13 — Agenda habilitable por paciente
- Toggle en la ficha del paciente. Columna `agenda_habilitada` (default false — el terapeuta la activa).
- Falta: cablear la UI de "agendar" del paciente para que respete el flag (la columna ya está lista).

### ✅ #12 — Aviso de confidencialidad
- Texto legal versionado (`VERSION_AVISO`) en 5 secciones basadas en LFPDPPP + NOM-004.
- Gate: el terapeuta debe aceptarlo antes de entrar al panel. Se registra en tabla `consentimientos` (IP, user_agent, snapshot, versión). **Verificado:** el gate aparece tras login y el panel se desbloquea al aceptar.
- ⚠️ El texto es **borrador** — debe revisarlo un abogado antes de producción.
- Falta: lado paciente en mobile (el onboarding ya tiene un consentimiento; se enriquecerá).

### 🟡 #3 — Plantillas terapéuticas (base sólida hecha)
- **7 plantillas oficiales** sembradas y **visibles/asignables** en la Biblioteca del terapeuta:
  1. Auto-registro (situación/emoción/pensamiento)
  2. Registro de pensamientos automáticos (TCC)
  3. Hoja en blanco (escritura libre)
  4. Respiración 4-7-8
  5. Relajación muscular progresiva
  6. Atención plena 5-4-3-2-1 (mindfulness)
  7. Escaneo corporal con semáforo de emociones
- **7 piezas de psicoeducación** (Ansiedad, Depresión, TCC, Activación Conductual, ACT, DBT, FAP) — sembradas, `publicado=false` hasta revisión.
- Fecha límite en tareas: **ya existe en el schema** (`tareas.fecha_limite`).
- ⚠️ Contenido clínico es **borrador** — requiere validación de un profesional de salud mental antes de mostrarse a pacientes reales.
- **Falta de #3:** form builder tipo Google Forms (crear formularios custom), upload de PDFs (Supabase Storage), UI para poner fecha límite al asignar.

### 🐛 Fix crítico descubierto y resuelto
Todo el lado del terapeuta (lista de pacientes, ficha, dashboard, mensajes, sesiones) mostraba **vacío** por un bug latente: el embed `profiles!vinculaciones_paciente_id_fkey` no resolvía en PostgREST (el FK apunta a `pacientes`, no a `profiles`). Reparado en 6 archivos con resolución de perfiles en dos pasos. **Verificado:** María González ahora aparece correctamente en todas las vistas.

---

## Lo que falta y POR QUÉ (honesto)

### Requiere TU decisión / cuentas (no puedo hacerlo solo)

**#6 — IA por voz.** Necesita tu cuenta de OpenAI y API key. Mi recomendación técnica (ya te la di): OpenAI Whisper (voz→texto) + GPT-4o mini (texto) + TTS. ~$5 USD/mes por terapeuta activo. Cuando tengas la key, cableo todo: transcripción, tool-calling ("agenda cita", "abre paciente X"), y respuesta hablada.

**#10 — Pagos.** Necesita: (a) tus precios definitivos (paciente→terapeuta y terapeuta→NOEMA), (b) cuenta Stripe conectada, (c) decisión sobre comisiones. El schema de Stripe ya existe. Cuando me pases los costos, configuro productos, precios, checkout, y el registro manual de pagos en efectivo.

**#11 — Dashboard financiero.** Depende de #10. Una vez haya pagos, construyo MRR, cobros pendientes, churn, reportes.

### Trabajo grande pendiente (safe, pero necesita tiempo dedicado)

**#1 — Realtime.** Supabase Realtime para que cuando el paciente registre algo, aparezca al instante en el panel del terapeuta (hoy aparece al recargar/navegar). ~4-6 horas.

**#2 — Push + mensajes prehechos + IA.** Expo Push notifications + biblioteca de mensajes preescritos + botón "sugerir con IA" (este último depende de #6). ~15-20 horas.

**#3 (resto) — Form builder + PDFs.** El constructor de formularios tipo Google Forms es la pieza más grande. Upload de PDFs con Supabase Storage. ~25-35 horas.

**#4 — Métricas + NOM-004.** Cruce conductas/emociones/progreso, adherencia, expediente clínico completo según NOM-004-SSA3-2012. ⚠️ Confírmame que es esa norma. ~15-20 horas.

**#5 (resto) — Adjuntos + inmutabilidad.** Upload de imágenes/PDFs a las notas + soft-delete estricto (nada se borra del historial). ~8-12 horas.

---

## Migrations aplicadas esta sesión
```
00019_fix_security_role_escalation    (fix crítico seguridad)
00020_fix_notas_privadas_leak         (fix crítico seguridad)
00021_fase_a_config_vinculacion       (#8, #9, #13 + fix crítico #4)
00022_seed_plantillas_oficiales       (#3 — 7 plantillas)
00023_seed_psicoeducacion             (#3 — 7 psicoeducación)
```

## Cómo probar lo nuevo
Deploy Vercel bloqueado por protección de free tier (ver MIGRACION-REPORTE.md §5).
Mientras tanto, todo verificado corriendo el dev server local contra Supabase cloud:
```
cd apps/terapeuta && pnpm dev   # localhost:3006
Login: andrea.ruiz@demo.noema.app / demo-noema-2026
```
Flujo: aparece el aviso de confidencialidad → aceptar → Pacientes (verás a María con
filtros de riesgo y buscador) → abre su ficha → botón de config (riesgo + toggles SOS/agenda)
→ Recursos (verás las 7 plantillas oficiales).

---

## Recomendación de prioridad para cuando regreses
1. **Desbloquear Vercel** (3 min, §5 del otro reporte) para que todo sea público.
2. **Definir precios** → me destraba #10 y #11.
3. **Crear cuenta OpenAI** → me destraba #6 y la parte IA de #2.
4. **Conseguir revisión clínica** del contenido de plantillas/psicoeducación (una psicóloga) → me destraba publicar #3.
5. Con eso desbloqueado, ataco #1, #2, #4, #5 en orden.

---

# FUNCIONES DEL PACIENTE (11 requerimientos)

**Actualizado:** 2026-07-18

| # | Función del paciente | Estado |
|---|---|---|
| 1 | Mensajes autoayuda push por algoritmo/historial | 🟡 Corpus + algoritmo ✅ hechos; falta push + revisión clínica |
| 2 | Acceso y respuesta a tareas asignadas | 🟡 Pantallas existen; falta render dinámico de formatos |
| 3 | Recordatorios de tareas + alarmas propias | 🔴 Falta infra expo-notifications |
| 4 | Retroalimentación tras cada tarea | 🔴 Nuevo |
| 5 | Recordatorios/tareas propias + panel de progreso | 🔴 Nuevo |
| 6 | Botón SOS si el terapeuta lo activa | ✅ **Hecho y verificado** |
| 7 | Métricas de progreso (datos duros, SIN interpretación) | 🟡 Pantalla `analisis` existe; falta enfoque de patrones |
| 8 | Diario emocional con control de privacidad | ✅ Ya existía (privado/compartido/marcado) |
| 9 | Aviso de confidencialidad al primer uso | ✅ **Hecho y verificado** |
| 10 | Vinculación en agenda al agendar cita | 🟡 Sesiones existen; falta sync bidireccional |
| 11 | Paciente agenda si el terapeuta lo habilita | 🟡 Flag `agenda_habilitada` listo; falta UI de agendar |

**Completados esta sesión (paciente): #6, #9 + base sólida de #1.**

## Detalle de lo hecho (paciente)

### ✅ #9 — Aviso de confidencialidad al primer uso
- `apps/mobile/src/lib/aviso-privacidad.ts`: texto legal versionado en 6 secciones — enfatiza que el paciente decide qué comparte, lo privado es inviolable, es responsable de cuidar lo que comparte.
- Pantalla `(onboarding)/aviso-privacidad.tsx` + gate en el AuthGate: el paciente debe aceptarlo antes de usar la app. Se registra en `consentimientos`.
- Junto con #12 (terapeuta) cierra la confidencialidad **bilateral**.
- ⚠️ Texto borrador — revisar con abogado.

### 🟡 #1 — Mensajes de autoayuda (base sólida hecha)
- **Schema** (`mensajes_autoayuda`): corpus clasificado por objetivo clínico × enfoque terapéutico × contexto de envío, con acción concreta y filtro de riesgo.
- **Algoritmo** (`mensajes_autoayuda_para_paciente`): mapea los motivos de consulta del paciente → objetivos clínicos, filtra por su nivel de riesgo (SEGURIDAD: no manda mensajes automáticos a riesgo alto/crítico), evita repetir en 14 días. **Verificado** funcionando.
- **Corpus inicial:** 27 mensajes FUNCIONALES (no frases motivacionales vacías) — cada uno con una acción concreta, basados en TCC/ACT/DBT/Activación Conductual/Mindfulness/autocompasión.
- ⚠️ **Falta para completar #1:**
  1. **Validación + ampliación clínica** del corpus (una psicóloga debe revisar el tono, corregir y expandir a "todos los casos" como pediste — 27 es un punto de partida, no exhaustivo).
  2. **Entrega por push:** requiere infraestructura Expo Notifications (registro de tokens, programación de envíos, cron). Es una pieza de infra aparte.

### 🐛 Fix de bug encontrado
El trigger `proteger_columnas_vinculacion` (que protege columnas del terapeuta) bloqueaba también al `service_role` (admin/edge functions/seeds), porque su `auth.uid()` es null. Reparado: ahora exime service_role. La protección sigue aplicando al paciente.

## Lo que falta del paciente y por qué

**Necesita decisión/recursos tuyos:**
- **#1 completar** → revisión clínica del corpus (psicóloga) + decisión de cuándo activar push.
- **#3, push de #1** → requiere setup Expo Notifications (infra; se verifica solo con build real en dispositivo, no en dev).

**Trabajo bounded pendiente (safe):**
- #2 render dinámico de formatos de tarea (campos_respuesta) ~6-8h
- #3 recordatorios locales + alarmas del paciente (expo-notifications) ~8-10h
- #4 retroalimentación del terapeuta tras tarea ~6h
- #5 tareas/recordatorios propios + panel de progreso personal ~12-15h
- #7 métricas datos-duros con patrones bienestar/malestar (SIN interpretación) ~10-12h
- #10 sync agenda terapeuta→paciente ~6h
- #11 UI de agendar del paciente respetando `agenda_habilitada` ~8h

## Migrations añadidas (paciente)
```
00024_mensajes_autoayuda           (#1 schema + algoritmo)
00025_seed_mensajes_autoayuda      (#1 corpus 27 mensajes, borrador)
00026_fix_trigger_service_role     (fix bug del trigger)
```
