-- =============================================================================
-- NOEMA · 00043 · Configuración del terapeuta y funciones por paciente
-- =============================================================================
-- Dos niveles, como en cualquier app profesional:
--
--   1. `configuracion_terapeuta` → valores POR DEFECTO que el terapeuta define
--      una vez en Ajustes, más sus propias preferencias de notificación.
--   2. Columnas en `vinculaciones` → el valor REAL de cada paciente, que puede
--      diferir del defecto (un paciente en riesgo no se configura igual que uno
--      estable). La app siempre lee de aquí.
--
-- Al crear una vinculación, un trigger copia los defectos del terapeuta.
-- Idempotente.
-- =============================================================================

-- ── 1. Configuración global del terapeuta ────────────────────────────────────
create table if not exists public.configuracion_terapeuta (
  terapeuta_id uuid primary key references public.terapeutas(profile_id) on delete cascade,

  -- Funciones del paciente (valores por defecto para nuevos pacientes)
  sos_habilitado           boolean not null default true,
  chat_habilitado          boolean not null default true,
  agenda_habilitada        boolean not null default false,
  diario_habilitado        boolean not null default true,
  registros_habilitados    boolean not null default true,
  tareas_habilitadas       boolean not null default true,
  progreso_habilitado      boolean not null default true,
  mensajes_ia_habilitados  boolean not null default true,
  notif_paciente           boolean not null default true,

  -- Mis notificaciones (experiencia del propio terapeuta)
  notif_sonido             text    not null default 'suave', -- 'suave'|'campana'|'silencioso'
  notif_mensajes           boolean not null default true,
  notif_registros          boolean not null default true,
  notif_crisis             boolean not null default true,
  notif_tareas             boolean not null default true,

  -- No molestar (fuera de horario no suena; la notificación igual se registra)
  no_molestar_activo       boolean not null default false,
  no_molestar_desde        time    not null default '21:00',
  no_molestar_hasta        time    not null default '08:00',

  actualizado_at           timestamptz not null default now()
);

comment on table public.configuracion_terapeuta is
  'Preferencias del terapeuta: defectos de funciones para nuevos pacientes + sus propias notificaciones.';

alter table public.configuracion_terapeuta enable row level security;

drop policy if exists configuracion_terapeuta_propia on public.configuracion_terapeuta;
create policy configuracion_terapeuta_propia on public.configuracion_terapeuta
  for all using (terapeuta_id = auth.uid())
  with check (terapeuta_id = auth.uid());

-- ── 2. Funciones habilitadas por paciente ────────────────────────────────────
-- (sos_habilitado y agenda_habilitada ya existían — migración 00021)
alter table public.vinculaciones
  add column if not exists chat_habilitado         boolean not null default true,
  add column if not exists diario_habilitado       boolean not null default true,
  add column if not exists registros_habilitados   boolean not null default true,
  add column if not exists tareas_habilitadas      boolean not null default true,
  add column if not exists progreso_habilitado     boolean not null default true,
  add column if not exists mensajes_ia_habilitados boolean not null default true,
  add column if not exists notif_paciente          boolean not null default true;

comment on column public.vinculaciones.mensajes_ia_habilitados is
  'Si el paciente recibe los mensajes de acompañamiento que genera NOEMA (IA).';

-- ── 3. Al crear una vinculación, hereda los defectos del terapeuta ───────────
create or replace function public.aplicar_defectos_vinculacion()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cfg public.configuracion_terapeuta%rowtype;
begin
  select * into cfg from public.configuracion_terapeuta
  where terapeuta_id = new.terapeuta_id;

  -- Si el terapeuta aún no ha tocado Ajustes, se quedan los defaults de la tabla.
  if not found then return new; end if;

  new.sos_habilitado           := cfg.sos_habilitado;
  new.chat_habilitado          := cfg.chat_habilitado;
  new.agenda_habilitada        := cfg.agenda_habilitada;
  new.diario_habilitado        := cfg.diario_habilitado;
  new.registros_habilitados    := cfg.registros_habilitados;
  new.tareas_habilitadas       := cfg.tareas_habilitadas;
  new.progreso_habilitado      := cfg.progreso_habilitado;
  new.mensajes_ia_habilitados  := cfg.mensajes_ia_habilitados;
  new.notif_paciente           := cfg.notif_paciente;
  return new;
end $$;

drop trigger if exists trg_defectos_vinculacion on public.vinculaciones;
create trigger trg_defectos_vinculacion
  before insert on public.vinculaciones
  for each row execute function public.aplicar_defectos_vinculacion();

-- ── 4. Fila de configuración para los terapeutas que ya existen ──────────────
insert into public.configuracion_terapeuta (terapeuta_id)
select profile_id from public.terapeutas
on conflict (terapeuta_id) do nothing;
