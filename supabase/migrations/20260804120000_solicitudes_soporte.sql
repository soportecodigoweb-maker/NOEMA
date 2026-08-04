-- Solicitudes de soporte / dudas / sugerencias que llegan al Panel de Dueño.
-- Las envía cualquier usuario (paciente o terapeuta) desde su app.

create table if not exists public.solicitudes_soporte (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete set null,
  usuario_email text,
  usuario_nombre text,
  usuario_rol text,
  tipo text not null default 'duda',
  asunto text,
  mensaje text not null,
  estado text not null default 'abierta',
  creado_at timestamptz not null default now(),
  resuelto_at timestamptz,
  constraint solicitudes_estado_chk check (estado in ('abierta', 'en_proceso', 'resuelta')),
  constraint solicitudes_tipo_chk check (tipo in ('soporte', 'duda', 'sugerencia', 'observacion'))
);

alter table public.solicitudes_soporte enable row level security;

-- El usuario puede crear y ver sus propias solicitudes.
drop policy if exists soporte_propia on public.solicitudes_soporte;
create policy soporte_propia on public.solicitudes_soporte
  for all
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create index if not exists idx_soporte_estado on public.solicitudes_soporte(estado, creado_at desc);
