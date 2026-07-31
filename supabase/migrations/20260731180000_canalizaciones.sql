-- Canalización con consentimiento del paciente.
-- El terapeuta crea una canalización PENDIENTE con el informe ya revisado; el
-- paciente debe aceptar que su información se envíe al otro terapeuta. Solo al
-- aceptar se completa la transferencia.

create table if not exists public.canalizaciones (
  id uuid primary key default gen_random_uuid(),
  vinculacion_id uuid not null references public.vinculaciones(id) on delete cascade,
  terapeuta_origen uuid references public.profiles(id) on delete set null,
  terapeuta_destino uuid references public.profiles(id) on delete set null,
  cedula_destino text,
  destino_nombre text,
  informe text not null,
  estado text not null default 'pendiente',
  creada_at timestamptz not null default now(),
  resuelta_at timestamptz,
  constraint canalizaciones_estado_chk check (estado in ('pendiente', 'aceptada', 'rechazada'))
);

alter table public.canalizaciones enable row level security;

-- El terapeuta de origen ve sus canalizaciones.
drop policy if exists canalizaciones_origen on public.canalizaciones;
create policy canalizaciones_origen on public.canalizaciones
  for all
  using (terapeuta_origen = auth.uid())
  with check (terapeuta_origen = auth.uid());

-- El paciente ve las canalizaciones de su vinculación (aceptar/rechazar va por acción admin).
drop policy if exists canalizaciones_paciente_sel on public.canalizaciones;
create policy canalizaciones_paciente_sel on public.canalizaciones
  for select
  using (exists (select 1 from public.vinculaciones v where v.id = vinculacion_id and v.paciente_id = auth.uid()));

create index if not exists idx_canalizaciones_vinc on public.canalizaciones(vinculacion_id);
create index if not exists idx_canalizaciones_pendiente on public.canalizaciones(vinculacion_id, estado);
