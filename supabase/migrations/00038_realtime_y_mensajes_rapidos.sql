-- =============================================================================
-- NOEMA · 00038 · Realtime + mensajes rápidos del terapeuta (R2 · #4, #6, #7)
-- =============================================================================
-- 1. Habilita Realtime (Postgres Changes) en las tablas que se sincronizan en
--    tiempo real entre paciente y terapeuta: mensajes y alertas de crisis.
-- 2. Crea `mensajes_rapidos`: respuestas predefinidas que el terapeuta puede
--    enviar de inmediato a un paciente tras un registro emocional (#6, #7).
-- Idempotente.
-- =============================================================================

-- ── 1. Realtime ──────────────────────────────────────────────────────────────
-- La publicación `supabase_realtime` existe por defecto en Supabase. Añadir una
-- tabla que ya esté publicada lanza error, así que verificamos antes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes'
  ) then
    alter publication supabase_realtime add table public.mensajes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alertas_crisis'
  ) then
    alter publication supabase_realtime add table public.alertas_crisis;
  end if;
end $$;

-- ── 2. Mensajes rápidos del terapeuta ────────────────────────────────────────
create table if not exists public.mensajes_rapidos (
  id              uuid primary key default gen_random_uuid(),
  terapeuta_id    uuid not null references public.terapeutas(profile_id) on delete cascade,
  -- null = disponible para todos los pacientes del terapeuta;
  -- uuid = mensaje configurado para un paciente específico (#7 "por paciente").
  vinculacion_id  uuid references public.vinculaciones(id) on delete cascade,
  texto           text not null,
  orden           int not null default 0,
  creado_at       timestamptz not null default now()
);

comment on table public.mensajes_rapidos is
  'Respuestas predefinidas que el terapeuta envía en tiempo real a un paciente (#6/#7). vinculacion_id null = para todos sus pacientes.';

create index if not exists mensajes_rapidos_terapeuta_idx
  on public.mensajes_rapidos (terapeuta_id);
create index if not exists mensajes_rapidos_vinculacion_idx
  on public.mensajes_rapidos (vinculacion_id);

alter table public.mensajes_rapidos enable row level security;

-- El terapeuta gestiona (CRUD) solo sus propios mensajes rápidos.
drop policy if exists mensajes_rapidos_terapeuta_all on public.mensajes_rapidos;
create policy mensajes_rapidos_terapeuta_all on public.mensajes_rapidos
  for all
  using (terapeuta_id = auth.uid())
  with check (terapeuta_id = auth.uid());

-- Semillas de ejemplo para la terapeuta demo (Andrea), disponibles para todos
-- sus pacientes. Idempotente por (terapeuta_id, texto).
do $$
declare
  v_terapeuta uuid;
begin
  select profile_id into v_terapeuta
  from public.terapeutas t
  join public.profiles p on p.id = t.profile_id
  where p.email = 'andrea.ruiz@demo.noema.app'
  limit 1;

  if v_terapeuta is not null then
    insert into public.mensajes_rapidos (terapeuta_id, vinculacion_id, texto, orden)
    select v_terapeuta, null, x.texto, x.orden
    from (values
      ('Gracias por compartir cómo te sientes. Estoy leyéndote.', 1),
      ('Respira conmigo un momento: inhala 4, sostén 7, exhala 8. Estoy aquí.', 2),
      ('¿Quieres que agendemos un espacio para hablar de esto?', 3),
      ('Recuerda lo que trabajamos: esto que sientes es válido y va a pasar.', 4)
    ) as x(texto, orden)
    where not exists (
      select 1 from public.mensajes_rapidos m
      where m.terapeuta_id = v_terapeuta and m.texto = x.texto
    );
  end if;
end $$;
