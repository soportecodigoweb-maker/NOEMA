-- =============================================================================
-- NOEMA · 00013 · Consentimientos y preferencias de privacidad
-- =============================================================================
-- BIBLIA §12: el paciente decide qué comparte y qué no. Siempre.
-- =============================================================================

-- Registro histórico de cada consentimiento aceptado --------------------------

create table public.consentimientos (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  tipo                tipo_consentimiento not null,
  version             text not null, -- '2026-05-v1'
  aceptado            boolean not null,
  texto_resumen       text, -- snapshot del texto que se aceptó
  ip                  inet,
  user_agent          text,
  aceptado_at         timestamptz not null default now()
);

comment on table public.consentimientos is 'Registro auditable de cada consentimiento aceptado/rechazado por el usuario.';

create index consentimientos_profile_idx on public.consentimientos(profile_id, tipo, aceptado_at desc);

-- Preferencias de privacidad del paciente -------------------------------------

create table public.preferencias_privacidad (
  paciente_id                         uuid primary key references public.pacientes(profile_id) on delete cascade,

  -- Defaults para nuevos registros/diario (el paciente puede sobrescribir por entrada)
  privacidad_registro_default         nivel_privacidad not null default 'privado',
  privacidad_diario_default           nivel_privacidad not null default 'privado',

  -- Permisos al terapeuta
  permitir_resumen_ia                 boolean not null default false, -- IA puede leer registros compartidos
  permitir_acceso_archivos            boolean not null default true,
  recibir_mensajes_terapeuta          boolean not null default true,
  notificar_crisis_terapeuta          boolean not null default false,

  -- Permisos al sistema
  permitir_analytics_anonimo          boolean not null default true,
  permitir_recordatorios_push         boolean not null default true,
  permitir_emails_no_criticos         boolean not null default true,

  actualizado_at                      timestamptz not null default now()
);

create trigger preferencias_privacidad_set_actualizado_at
  before update on public.preferencias_privacidad
  for each row execute function public.set_actualizado_at();

-- Crear preferencias por defecto cuando se crea un paciente ------------------

create or replace function public.crear_preferencias_paciente_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.preferencias_privacidad (paciente_id)
  values (new.profile_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger pacientes_crear_preferencias
  after insert on public.pacientes
  for each row execute function public.crear_preferencias_paciente_default();

alter table public.consentimientos enable row level security;
alter table public.preferencias_privacidad enable row level security;
