-- Supervisión clínica en centros terapéuticos.
-- El centro puede activar supervisión; cada terapeuta debe autorizar el acceso.
-- Si NO está activada, el centro pide autorización por cada paciente.

alter table public.centros
  add column if not exists supervision_clinica boolean not null default false;

alter table public.centro_terapeutas
  add column if not exists supervision_autorizada boolean not null default false,
  add column if not exists supervision_autorizada_at timestamptz;

-- Solicitudes de acceso puntual (cuando la supervisión general NO está activada).
create table if not exists public.supervision_solicitudes (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.profiles(id) on delete cascade,
  terapeuta_id uuid not null references public.profiles(id) on delete cascade,
  vinculacion_id uuid not null references public.vinculaciones(id) on delete cascade,
  estado text not null default 'pendiente',
  creado_at timestamptz not null default now(),
  resuelto_at timestamptz,
  expira_at timestamptz,
  constraint sup_sol_estado_chk check (estado in ('pendiente', 'autorizada', 'rechazada'))
);

-- Bitácora de accesos del centro a la información de un paciente (día/hora).
create table if not exists public.supervision_accesos (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null,
  terapeuta_id uuid,
  vinculacion_id uuid,
  accedido_at timestamptz not null default now()
);

-- Observaciones del supervisor (centro) sobre la práctica del terapeuta.
create table if not exists public.supervision_comentarios (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null,
  terapeuta_id uuid not null,
  texto text not null,
  creado_at timestamptz not null default now()
);

alter table public.supervision_solicitudes enable row level security;
alter table public.supervision_accesos enable row level security;
alter table public.supervision_comentarios enable row level security;
-- Todo el acceso pasa por acciones de servidor con service role y verificación.

create index if not exists idx_sup_sol_terapeuta on public.supervision_solicitudes(terapeuta_id, estado);
create index if not exists idx_sup_sol_vinc on public.supervision_solicitudes(vinculacion_id, estado);
create index if not exists idx_sup_acc_terapeuta on public.supervision_accesos(terapeuta_id, accedido_at desc);
create index if not exists idx_sup_com_terapeuta on public.supervision_comentarios(terapeuta_id, creado_at desc);
