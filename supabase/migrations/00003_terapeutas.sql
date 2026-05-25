-- =============================================================================
-- NOEMA · 00003 · Terapeutas (perfil profesional + directorio)
-- =============================================================================
-- Un terapeuta es un profile con rol='terapeuta' + esta fila con la información
-- profesional. Esta tabla alimenta el directorio público.
-- =============================================================================

create table public.terapeutas (
  profile_id              uuid primary key references public.profiles(id) on delete cascade,

  -- Identidad profesional
  cedula_profesional      text,
  titulo                  text, -- "Lic. en Psicología", "Mtra. en Psicoterapia"
  descripcion             text, -- bio editorial para directorio
  video_presentacion_url  text,

  -- Especialización (arrays para búsqueda en directorio)
  especialidades          text[] not null default array[]::text[],
  enfoques                text[] not null default array[]::text[], -- "cognitivo-conductual", "gestalt", etc
  idiomas                 text[] not null default array['es-MX']::text[],
  poblaciones_atendidas   text[] not null default array[]::text[], -- "adultos", "adolescentes", "parejas"

  -- Atención
  modalidades             modalidad_sesion[] not null default array['online']::modalidad_sesion[],
  experiencia_anios       int check (experiencia_anios >= 0),
  acepta_nuevos_pacientes boolean not null default true,

  -- Precio
  precio_sesion_mxn       int check (precio_sesion_mxn >= 0),

  -- Verificación
  estado_verificacion     estado_verificacion not null default 'sin_verificar',
  verificado_at           timestamptz,
  verificado_por          uuid references public.profiles(id),

  -- Comercial
  plan                    plan_terapeuta not null default 'gratuito',
  prueba_premium_inicio   timestamptz,
  prueba_premium_fin      timestamptz,

  -- Stripe (Fase 7)
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,

  -- Directorio (cacheado para queries rápidas)
  pacientes_activos_count int not null default 0 check (pacientes_activos_count >= 0),
  ultima_actividad        timestamptz,
  ranking_score           numeric(10,4) not null default 0, -- calculado por función separada

  creado_at               timestamptz not null default now(),
  actualizado_at          timestamptz not null default now()
);

comment on table public.terapeutas is 'Perfil profesional. 1:1 con profile (rol=terapeuta).';
comment on column public.terapeutas.ranking_score is 'Score calculado para ordenar el directorio. NO se vende — depende de actividad real y completitud.';

create index terapeutas_estado_verificacion_idx on public.terapeutas(estado_verificacion);
create index terapeutas_acepta_nuevos_idx on public.terapeutas(acepta_nuevos_pacientes) where acepta_nuevos_pacientes;
create index terapeutas_ranking_idx on public.terapeutas(ranking_score desc);
create index terapeutas_especialidades_idx on public.terapeutas using gin(especialidades);
create index terapeutas_enfoques_idx on public.terapeutas using gin(enfoques);
create index terapeutas_modalidades_idx on public.terapeutas using gin(modalidades);

create trigger terapeutas_set_actualizado_at
  before update on public.terapeutas
  for each row execute function public.set_actualizado_at();

-- Horarios disponibles del terapeuta -----------------------------------------

create table public.terapeuta_horarios (
  id              uuid primary key default gen_random_uuid(),
  terapeuta_id    uuid not null references public.terapeutas(profile_id) on delete cascade,
  dia_semana      int not null check (dia_semana between 0 and 6), -- 0=domingo, 6=sábado
  hora_inicio     time not null,
  hora_fin        time not null,
  modalidad       modalidad_sesion not null default 'online',
  activo          boolean not null default true,
  creado_at       timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

create index terapeuta_horarios_idx on public.terapeuta_horarios(terapeuta_id, dia_semana) where activo;

-- Helper: ¿es terapeuta verificado? -------------------------------------------

create or replace function public.es_terapeuta_verificado(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.terapeutas
    where profile_id = p_profile_id
      and estado_verificacion = 'verificado'
  );
$$;

grant execute on function public.es_terapeuta_verificado(uuid) to authenticated;

alter table public.terapeutas enable row level security;
alter table public.terapeuta_horarios enable row level security;
