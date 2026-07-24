-- =============================================================================
-- NOEMA · 00042 · Mensajes personales generados por NOEMA (IA)
-- =============================================================================
-- Mensajes de acompañamiento que NOEMA escribe para el paciente basándose en
-- SUS PROPIOS registros (R2 · punto 5). No son motivacionales genéricos: parten
-- de lo que la persona registró.
--
-- Privacidad: el mensaje se genera con los datos del propio paciente y es SOLO
-- para él. El terapeuta NO los ve — no es material clínico ni interpretación.
--
-- `basado_en` guarda el resumen exacto que se le pasó al modelo, por
-- transparencia y para poder auditar qué se usó.
-- Idempotente.
-- =============================================================================

create table if not exists public.mensajes_noema (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references public.pacientes(profile_id) on delete cascade,
  texto        text not null,
  -- Resumen de datos que se usó para generarlo (auditoría/transparencia).
  basado_en    jsonb not null default '{}'::jsonb,
  modelo       text,
  -- 'ia' = generado por el modelo; 'fallback' = respuesta canónica sin modelo.
  origen       text not null default 'ia',
  generado_at  timestamptz not null default now(),
  visto_at     timestamptz
);

comment on table public.mensajes_noema is
  'Mensajes de acompañamiento generados por NOEMA (IA) a partir de los registros del propio paciente. Privados del paciente.';

create index if not exists mensajes_noema_paciente_idx
  on public.mensajes_noema (paciente_id, generado_at desc);

alter table public.mensajes_noema enable row level security;

-- Solo el paciente ve y marca como vistos sus propios mensajes.
drop policy if exists mensajes_noema_paciente_select on public.mensajes_noema;
create policy mensajes_noema_paciente_select on public.mensajes_noema
  for select using (paciente_id = auth.uid());

drop policy if exists mensajes_noema_paciente_update on public.mensajes_noema;
create policy mensajes_noema_paciente_update on public.mensajes_noema
  for update using (paciente_id = auth.uid())
  with check (paciente_id = auth.uid());

drop policy if exists mensajes_noema_paciente_insert on public.mensajes_noema;
create policy mensajes_noema_paciente_insert on public.mensajes_noema
  for insert with check (paciente_id = auth.uid());
