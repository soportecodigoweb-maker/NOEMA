# Supabase · NOEMA

Schema, RLS, triggers y seed para el backend de NOEMA.

---

## Cómo arrancar

Requiere Docker Desktop corriendo.

```powershell
# Desde la raíz del monorepo
pnpm supabase:start          # arranca Postgres, Auth, Storage, Studio
pnpm supabase:reset          # aplica migraciones + seed desde cero
pnpm supabase:types          # regenera packages/database/src/types.ts
```

URLs locales (puertos NOEMA — rango 546xx para no chocar con otros proyectos):

| Servicio | URL |
|---|---|
| API (REST + GraphQL) | http://127.0.0.1:54621 |
| Studio (UI) | http://127.0.0.1:54623 |
| Inbucket (emails) | http://127.0.0.1:54624 |
| Postgres directo | postgresql://postgres:postgres@127.0.0.1:54622/postgres |

---

## Estructura de migraciones

Cada migración cubre **un dominio** y es independiente. El orden numérico
garantiza dependencias correctas.

| # | Archivo | Qué hace |
|---|---|---|
| 00001 | `extensions_and_enums.sql` | Extensiones (uuid, pgcrypto, citext, pg_trgm) y todos los `type enum` del dominio |
| 00002 | `profiles.sql` | Tabla padre `profiles`, trigger auto-creación desde `auth.users`, helpers `profile_id()`/`mi_rol()` |
| 00003 | `terapeutas.sql` | Perfil profesional, horarios, helper `es_terapeuta_verificado` |
| 00004 | `pacientes_y_vinculaciones.sql` | Pacientes, vinculaciones con código auto-generado, helpers `es_terapeuta_de`/`paciente_autoriza_alerta_crisis` |
| 00005 | `emociones_y_registros.sql` | Catálogo de emociones + registros emocionales con 3 niveles de privacidad |
| 00006 | `diario.sql` | Diario personal (privacidad inviolable) + borrado de resumen IA al volver a privado |
| 00007 | `sesiones.sql` | Sesiones programadas/realizadas + notas (pública y privada) |
| 00008 | `tareas_y_ejercicios.sql` | Plantillas (oficiales + propias), tareas asignadas, respuestas |
| 00009 | `mensajes.sql` | Mensajería asíncrona terapeuta↔paciente + vista de hilos |
| 00010 | `contenido_educativo.sql` | Catálogo tipo streaming, progreso, favoritos |
| 00011 | `recursos_asignados.sql` | Recursos recomendados por el terapeuta al paciente |
| 00012 | `modulo_crisis.sql` | Contactos de confianza + recursos de emergencia + alertas |
| 00013 | `consentimientos_y_privacidad.sql` | Audit de consentimientos + preferencias del paciente |
| 00014 | `auditoria.sql` | Audit log + triggers genéricos para tablas sensibles |
| 00015 | `rls_policies.sql` | **Todas las políticas RLS** — la última línea de defensa |
| 00016 | `triggers_coherencia.sql` | Conteos cacheados, última actividad, ranking del directorio |

## Seed

`seed/seed.sql` carga:

- **25 emociones** distribuidas en las 5 familias NOEMA (Tranquilo, Ansioso, Triste, Cansado, Feliz)
- **15 categorías** de contenido educativo
- **15 recursos de emergencia** (México prioritario + AR, CO, ES, US básicos)
- **5 plantillas oficiales** de ejercicios (respiración, diario de pensamientos, gratitud, registro de detonantes, sueño)

---

## Reglas no negociables aplicadas en este schema

1. **Diario privado inviolable** (BIBLIA §12)
   - `diario_entradas.privacidad = 'privado'` → RLS impide acceso del terapeuta
   - Al cambiar de compartido a privado, se borra el `resumen_ia`

2. **Notas privadas del terapeuta inviolables**
   - `sesion_notas.contenido_privado` → la app debe filtrar columnas cuando el lector es el paciente
   - RLS deja pasar la fila si `visible_paciente=true`, pero la columna privada nunca debe enviarse al cliente paciente

3. **Crisis nunca automática hacia el terapeuta**
   - `alertas_crisis.notificado_terapeuta` solo es `true` si `vinculaciones.notificar_crisis_terapeuta = true`
   - El paciente decide eso explícitamente, no es default

4. **Auditoría obligatoria**
   - Tablas `alertas_crisis`, `sesion_notas`, `consentimientos` tienen trigger automático que escribe en `audit_log`

5. **Paciente activo = base de cobro** (Fase 7)
   - `terapeutas.pacientes_activos_count` se mantiene actualizado con trigger
   - Solo cuentan vinculaciones en estado `'activa'`

---

## Cómo agregar una migración nueva

```powershell
# Crea archivo con timestamp + descripción
supabase migration new descripcion_corta

# Editar el archivo en supabase/migrations/
# Aplicar localmente
pnpm supabase:reset

# Regenerar tipos TS
pnpm supabase:types
```

**Importante**: nunca editar una migración ya commiteada. Si necesitas
cambiar algo, crea una nueva migración encima.
