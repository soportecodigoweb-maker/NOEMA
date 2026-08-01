-- Ecosistema de Centros Terapéuticos.
-- Un centro se registra como tal (rol 'centro'), tiene su cuenta, y sus
-- terapeutas se vinculan a él (tabla centro_terapeutas). El encargado del centro
-- puede dar continuidad a expedientes cuando un terapeuta se va.

-- 1. Nuevo rol.
alter type public.rol_usuario add value if not exists 'centro';

-- 2. Ficha del centro (1:1 con profile rol='centro').
create table if not exists public.centros (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  nombre_centro text not null,
  descripcion text,
  telefono text,
  ciudad text,
  codigo_centro text unique,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

alter table public.centros enable row level security;

-- El dueño del centro gestiona su ficha.
drop policy if exists centros_propio on public.centros;
create policy centros_propio on public.centros
  for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Cualquier usuario autenticado puede buscar un centro por su código (para vincularse).
drop policy if exists centros_lookup on public.centros;
create policy centros_lookup on public.centros
  for select
  using (auth.uid() is not null);
