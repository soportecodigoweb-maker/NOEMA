-- =============================================================================
-- NOEMA · 00001 · Extensiones y tipos enum
-- =============================================================================
-- Fundamentos del schema. Cargamos extensiones que vamos a necesitar y
-- definimos todos los enums del dominio. Mantenerlos centralizados aquí
-- facilita auditarlos.
-- =============================================================================

-- Extensiones ----------------------------------------------------------------

create extension if not exists "uuid-ossp"; -- uuid_generate_v4()
create extension if not exists "pgcrypto"; -- gen_random_uuid(), digest()
create extension if not exists "citext";    -- emails case-insensitive
create extension if not exists "pg_trgm";   -- búsquedas con LIKE eficientes (directorio)

-- Schema "private" para funciones internas que NO deben exponerse vía PostgREST
create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- Enums ----------------------------------------------------------------------

-- Roles principales del sistema
do $$ begin
  create type rol_usuario as enum ('terapeuta', 'paciente', 'sin_terapeuta', 'admin');
exception when duplicate_object then null; end $$;

-- Estado de un paciente respecto a un terapeuta
do $$ begin
  create type estado_vinculacion as enum ('pendiente', 'activa', 'pausada', 'finalizada', 'archivada');
exception when duplicate_object then null; end $$;

-- Niveles de privacidad para registros y diario (BIBLIA §12)
do $$ begin
  create type nivel_privacidad as enum ('privado', 'compartido', 'marcado_sesion');
exception when duplicate_object then null; end $$;

-- Familias emocionales (los 5 acentos NOEMA)
do $$ begin
  create type familia_emocional as enum ('tranquilo', 'ansioso', 'triste', 'cansado', 'feliz');
exception when duplicate_object then null; end $$;

-- Frecuencia de tareas asignadas
do $$ begin
  create type frecuencia_tarea as enum ('unica', 'diaria', 'semanal', 'mensual', 'personalizada');
exception when duplicate_object then null; end $$;

-- Estado de una tarea (en flujo del paciente)
do $$ begin
  create type estado_tarea as enum ('pendiente', 'en_progreso', 'completada', 'omitida');
exception when duplicate_object then null; end $$;

-- Estado de sesión
do $$ begin
  create type estado_sesion as enum ('programada', 'realizada', 'cancelada', 'reagendada');
exception when duplicate_object then null; end $$;

-- Modalidad de atención
do $$ begin
  create type modalidad_sesion as enum ('presencial', 'online', 'hibrida');
exception when duplicate_object then null; end $$;

-- Tipos de contenido educativo
do $$ begin
  create type tipo_contenido as enum ('video', 'audio', 'guia', 'curso', 'ejercicio', 'lectura');
exception when duplicate_object then null; end $$;

-- Nivel de contenido
do $$ begin
  create type nivel_contenido as enum ('inicial', 'intermedio', 'avanzado');
exception when duplicate_object then null; end $$;

-- Estado de verificación profesional
do $$ begin
  create type estado_verificacion as enum ('sin_verificar', 'en_revision', 'verificado', 'rechazado');
exception when duplicate_object then null; end $$;

-- Plan comercial del terapeuta
do $$ begin
  create type plan_terapeuta as enum ('gratuito', 'prueba_premium', 'activo', 'cancelado');
exception when duplicate_object then null; end $$;

-- Gravedad de alerta de crisis
do $$ begin
  create type gravedad_crisis as enum ('orientacion', 'moderada', 'alta', 'critica');
exception when duplicate_object then null; end $$;

-- Tipos de consentimiento
do $$ begin
  create type tipo_consentimiento as enum (
    'terminos_servicio',
    'aviso_privacidad',
    'consentimiento_informado',
    'compartir_con_terapeuta',
    'recibir_alertas_crisis',
    'uso_ia_resumenes'
  );
exception when duplicate_object then null; end $$;

-- Acciones auditables
do $$ begin
  create type accion_auditoria as enum (
    'insert', 'update', 'delete', 'view_sensitive', 'export', 'crisis_triggered', 'ai_generated'
  );
exception when duplicate_object then null; end $$;

comment on type rol_usuario is 'Roles principales: terapeuta paga el SaaS; paciente está vinculado; sin_terapeuta accede a contenido + directorio.';
comment on type nivel_privacidad is 'BIBLIA §12 — el diario privado es inviolable. compartido = visible para terapeuta; marcado_sesion = destacado para próxima sesión.';
comment on type familia_emocional is 'Los 5 acentos cromáticos de NOEMA. NO usar para etiquetar clínicamente.';
