-- =============================================================================
-- NOEMA · 00024 · Mensajes de autoayuda (requerimiento paciente #1)
-- =============================================================================
-- Corpus de mensajes de autoayuda FUNCIONALES (no motivacionales vacíos),
-- clasificados por objetivo clínico, enfoque terapéutico y contexto de envío.
-- Un algoritmo los asigna a cada paciente según su perfil clínico e historial.
--
-- ⚠️ El contenido es un BORRADOR informado en marcos basados en evidencia
-- (TCC, ACT, DBT, Activación Conductual, Mindfulness, autocompasión). NO está
-- publicado (publicado=false). DEBE ser validado y ampliado por un profesional
-- de salud mental antes de enviarse a pacientes reales.
--
-- ENTREGA DE PUSH: este módulo define el corpus y la selección. El ENVÍO real
-- por notificación push requiere infraestructura Expo Notifications (pendiente).
-- =============================================================================

-- Enums de clasificación -------------------------------------------------------
do $$ begin
  create type objetivo_autoayuda as enum (
    'ansiedad', 'depresion', 'autoestima', 'relaciones', 'estres',
    'regulacion_emocional', 'sueno', 'general'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type enfoque_autoayuda as enum (
    'tcc', 'act', 'dbt', 'activacion_conductual', 'mindfulness', 'autocompasion'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type contexto_autoayuda as enum (
    'manana', 'noche', 'post_registro_malestar', 'post_inactividad',
    'previo_sesion', 'general'
  );
exception when duplicate_object then null; end $$;

-- Corpus -----------------------------------------------------------------------
create table if not exists public.mensajes_autoayuda (
  id            uuid primary key default gen_random_uuid(),
  texto         text not null,
  objetivo      objetivo_autoayuda not null,
  enfoque       enfoque_autoayuda not null,
  contexto      contexto_autoayuda not null default 'general',
  -- Sugerencia de acción concreta que acompaña al mensaje (funcional, no vacío).
  accion        text,
  -- Nivel de riesgo máximo para el que es apropiado (no enviar mensajes ligeros
  -- a pacientes en riesgo alto/crítico sin curaduría del terapeuta).
  riesgo_maximo nivel_riesgo not null default 'medio',
  publicado     boolean not null default false,
  creado_at     timestamptz not null default now()
);

comment on table public.mensajes_autoayuda is
  'Corpus de mensajes de autoayuda funcionales. BORRADOR — requiere validación clínica antes de publicar.';

create index if not exists mensajes_autoayuda_objetivo_idx
  on public.mensajes_autoayuda(objetivo, contexto) where publicado;

-- Registro de envíos (para no repetir y para métricas) -------------------------
create table if not exists public.mensajes_autoayuda_enviados (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references public.pacientes(profile_id) on delete cascade,
  mensaje_id    uuid not null references public.mensajes_autoayuda(id) on delete cascade,
  enviado_at    timestamptz not null default now(),
  contexto      contexto_autoayuda not null default 'general'
);

create index if not exists mensajes_autoayuda_enviados_paciente_idx
  on public.mensajes_autoayuda_enviados(paciente_id, enviado_at desc);

alter table public.mensajes_autoayuda enable row level security;
alter table public.mensajes_autoayuda_enviados enable row level security;

-- RLS: el corpus publicado es legible por usuarios autenticados; los envíos
-- solo los ve el paciente dueño (y el terapeuta vía funciones si se decide).
create policy mensajes_autoayuda_select_publicado on public.mensajes_autoayuda
  for select using (publicado = true);

create policy mensajes_enviados_paciente on public.mensajes_autoayuda_enviados
  for select using (paciente_id = auth.uid());

-- Helper: orden numérico de un nivel de riesgo (para comparaciones).
-- Definido ANTES de la función de selección que lo usa.
create or replace function public.orden_riesgo(n nivel_riesgo)
returns int
language sql
immutable
as $$
  select case n
    when 'sin_evaluar' then 0
    when 'bajo' then 1
    when 'medio' then 2
    when 'alto' then 3
    when 'critico' then 4
  end;
$$;

-- =============================================================================
-- Algoritmo de selección
-- =============================================================================
-- Dado un paciente, devuelve mensajes elegibles según:
--   - sus motivos_consulta (pacientes.motivos_consulta) → objetivo clínico
--   - su nivel_riesgo (vinculacion activa) → filtro riesgo_maximo
--   - el contexto solicitado (mañana, post_malestar, etc.)
--   - evita repetir mensajes ya enviados en los últimos 14 días
-- Devuelve ordenado aleatoriamente (variedad), limitado.
--
-- NOTA: mapea motivos_consulta (texto libre del paciente) a objetivo con
-- coincidencia por palabra clave. Es un primer algoritmo; un profesional puede
-- refinar el mapeo.

create or replace function public.mensajes_autoayuda_para_paciente(
  p_paciente_id uuid,
  p_contexto contexto_autoayuda default 'general',
  p_limite int default 3
)
returns setof public.mensajes_autoayuda
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_riesgo nivel_riesgo;
  v_motivos text[];
  v_objetivos objetivo_autoayuda[];
begin
  -- Nivel de riesgo del paciente (de su vinculación activa)
  select coalesce(v.nivel_riesgo, 'sin_evaluar')
    into v_riesgo
  from public.vinculaciones v
  where v.paciente_id = p_paciente_id and v.estado = 'activa'
  limit 1;

  -- Motivos de consulta del paciente
  select coalesce(pac.motivos_consulta, array[]::text[])
    into v_motivos
  from public.pacientes pac
  where pac.profile_id = p_paciente_id;

  -- Mapear motivos (texto libre) → objetivos clínicos por palabra clave.
  -- Se usan raíces sin acento para tolerar variaciones de escritura.
  v_objetivos := array[]::objetivo_autoayuda[];
  if exists (select 1 from unnest(v_motivos) m where m ilike '%ansied%' or m ilike '%angust%' or m ilike '%panic%' or m ilike '%nico%')
    then v_objetivos := v_objetivos || 'ansiedad'::objetivo_autoayuda; end if;
  if exists (select 1 from unnest(v_motivos) m where m ilike '%depres%' or m ilike '%tristez%' or m ilike '%nimo%' or m ilike '%desgan%')
    then v_objetivos := v_objetivos || 'depresion'::objetivo_autoayuda; end if;
  if exists (select 1 from unnest(v_motivos) m where m ilike '%autoestim%' or m ilike '%valor%' or m ilike '%confianz%' or m ilike '%seguri%')
    then v_objetivos := v_objetivos || 'autoestima'::objetivo_autoayuda; end if;
  if exists (select 1 from unnest(v_motivos) m where m ilike '%relacion%' or m ilike '%pareja%' or m ilike '%familia%' or m ilike '%duelo%')
    then v_objetivos := v_objetivos || 'relaciones'::objetivo_autoayuda; end if;
  if exists (select 1 from unnest(v_motivos) m where m ilike '%estres%' or m ilike '%estr%' or m ilike '%trabajo%' or m ilike '%agot%' or m ilike '%burnout%')
    then v_objetivos := v_objetivos || 'estres'::objetivo_autoayuda; end if;
  if exists (select 1 from unnest(v_motivos) m where m ilike '%sueno%' or m ilike '%sue%' or m ilike '%dorm%' or m ilike '%insomni%')
    then v_objetivos := v_objetivos || 'sueno'::objetivo_autoayuda; end if;

  -- Siempre incluir 'general' y 'regulacion_emocional' como base
  v_objetivos := v_objetivos || 'general'::objetivo_autoayuda || 'regulacion_emocional'::objetivo_autoayuda;

  return query
  select m.*
  from public.mensajes_autoayuda m
  where m.publicado = true
    and m.objetivo = any(v_objetivos)
    and (m.contexto = p_contexto or m.contexto = 'general')
    -- Filtro de riesgo: no mandar mensajes por encima del riesgo del paciente
    and public.orden_riesgo(m.riesgo_maximo) >= public.orden_riesgo(v_riesgo)
    -- Evitar repetir lo enviado en los últimos 14 días
    and not exists (
      select 1 from public.mensajes_autoayuda_enviados e
      where e.paciente_id = p_paciente_id
        and e.mensaje_id = m.id
        and e.enviado_at > now() - interval '14 days'
    )
  order by random()
  limit p_limite;
end;
$$;

grant execute on function public.mensajes_autoayuda_para_paciente(uuid, contexto_autoayuda, int) to authenticated;
grant execute on function public.orden_riesgo(nivel_riesgo) to authenticated;
