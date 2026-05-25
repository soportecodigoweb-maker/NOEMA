-- =============================================================================
-- NOEMA · 00005 · Emociones (catálogo) y registros emocionales
-- =============================================================================
-- El registro emocional es el corazón funcional de la app paciente. Cada día
-- el paciente puede capturar una o varias entradas con emoción + intensidad +
-- contexto + nivel de privacidad.
-- =============================================================================

-- Catálogo de emociones específicas, agrupadas por familia (los 5 acentos NOEMA)

create table public.emociones_catalogo (
  key             text primary key,
  familia         familia_emocional not null,
  nombre_es       text not null,
  nombre_en       text,
  descripcion     text,
  orden           int not null default 0,
  activa          boolean not null default true
);

comment on table public.emociones_catalogo is 'Emociones específicas agrupadas por familia. Editable para A/B testing del lenguaje sin migración.';

create index emociones_familia_idx on public.emociones_catalogo(familia) where activa;

-- =============================================================================
-- Registros emocionales del paciente
-- =============================================================================

create table public.registros_emocionales (
  id                      uuid primary key default gen_random_uuid(),
  paciente_id             uuid not null references public.pacientes(profile_id) on delete cascade,

  -- Cuándo
  fecha                   date not null default current_date,
  hora                    time not null default current_time,
  registrado_at           timestamptz not null default now(),

  -- Qué se siente
  emocion_principal_key   text not null references public.emociones_catalogo(key),
  emociones_secundarias   text[] not null default array[]::text[], -- keys de emociones_catalogo
  intensidad              int not null check (intensidad between 1 and 5),

  -- Contexto (libre, opcional)
  descripcion             text,
  situacion_detonante     text,
  pensamientos            text,
  sensaciones_fisicas     text,
  conducta                text,

  -- Qué necesito ahora (BIBLIA — pantalla "Registro del día")
  necesidad               text, -- "descansar", "hablar con alguien", "tiempo para mi", "otra cosa"

  -- Privacidad (decisión del paciente, no del terapeuta)
  privacidad              nivel_privacidad not null default 'privado',

  -- Marca de crisis (la pone el sistema si detecta keywords; nunca el paciente directo)
  alerta_crisis_id        uuid, -- FK a alertas_crisis (creado en 00012)

  creado_at               timestamptz not null default now(),
  actualizado_at          timestamptz not null default now()
);

comment on table public.registros_emocionales is 'Microregistro emocional. La privacidad la define el paciente — el terapeuta solo ve los compartidos y marcados_sesion.';
comment on column public.registros_emocionales.alerta_crisis_id is 'Si está poblado, este registro disparó el módulo de crisis. Ver tabla alertas_crisis.';

create index registros_paciente_fecha_idx on public.registros_emocionales(paciente_id, fecha desc, hora desc);
create index registros_emocion_idx on public.registros_emocionales(paciente_id, emocion_principal_key);
create index registros_privacidad_idx on public.registros_emocionales(paciente_id, privacidad);
create index registros_marcado_sesion_idx on public.registros_emocionales(paciente_id)
  where privacidad = 'marcado_sesion';

create trigger registros_emocionales_set_actualizado_at
  before update on public.registros_emocionales
  for each row execute function public.set_actualizado_at();

-- View materializada-like para que el terapeuta vea solo lo permitido --------
-- (Es solo una vista normal; RLS se encarga del filtro real)

create or replace view public.registros_visibles_terapeuta as
select
  r.id,
  r.paciente_id,
  r.fecha,
  r.hora,
  r.emocion_principal_key,
  r.emociones_secundarias,
  r.intensidad,
  r.descripcion,
  r.situacion_detonante,
  r.necesidad,
  r.privacidad,
  r.creado_at
from public.registros_emocionales r
where r.privacidad in ('compartido', 'marcado_sesion');

comment on view public.registros_visibles_terapeuta is 'Vista filtrada para terapeutas — solo registros que el paciente decidió compartir. RLS aplica encima.';

alter table public.emociones_catalogo enable row level security;
alter table public.registros_emocionales enable row level security;
