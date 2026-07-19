-- =============================================================================
-- NOEMA · 00030 · Recordatorios y tareas propias del paciente (#5)
-- =============================================================================
-- El paciente puede crear sus propios recordatorios/metas (independientes de
-- las tareas que asigna el terapeuta) y verlos en un panel personal.
-- =============================================================================

create table if not exists public.recordatorios_personales (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references public.pacientes(profile_id) on delete cascade,
  titulo        text not null,
  nota          text,
  -- Fecha/hora opcional para recordatorio local (la app programa la notificación)
  recordar_at   timestamptz,
  -- Recurrencia simple (para recordatorios repetidos)
  recurrencia   text not null default 'unica', -- 'unica' | 'diaria' | 'semanal'
  completado    boolean not null default false,
  completado_at timestamptz,
  creado_at     timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

comment on table public.recordatorios_personales is
  'Recordatorios/metas que el paciente crea para sí mismo. Privados — el terapeuta NO los ve.';

create index if not exists recordatorios_paciente_idx
  on public.recordatorios_personales(paciente_id, completado, recordar_at);

create trigger recordatorios_set_actualizado_at
  before update on public.recordatorios_personales
  for each row execute function public.set_actualizado_at();

alter table public.recordatorios_personales enable row level security;

-- Solo el paciente dueño gestiona sus recordatorios. Privados por diseño.
create policy recordatorios_paciente_all on public.recordatorios_personales
  for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());
