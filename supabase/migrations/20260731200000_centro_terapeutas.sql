-- Membresía: terapeutas vinculados a un centro terapéutico.
-- El terapeuta se vincula con el código del centro. El centro ve a sus miembros.

create table if not exists public.centro_terapeutas (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centros(profile_id) on delete cascade,
  terapeuta_id uuid not null references public.profiles(id) on delete cascade,
  terapeuta_nombre text,
  estado text not null default 'activa',
  vinculado_at timestamptz not null default now(),
  constraint centro_terapeutas_estado_chk check (estado in ('activa', 'inactiva')),
  unique (centro_id, terapeuta_id)
);

alter table public.centro_terapeutas enable row level security;

-- El terapeuta gestiona su propia membresía (vincularse / salir).
drop policy if exists ct_terapeuta on public.centro_terapeutas;
create policy ct_terapeuta on public.centro_terapeutas
  for all
  using (terapeuta_id = auth.uid())
  with check (terapeuta_id = auth.uid());

-- El centro ve y gestiona a sus terapeutas.
drop policy if exists ct_centro on public.centro_terapeutas;
create policy ct_centro on public.centro_terapeutas
  for all
  using (centro_id = auth.uid())
  with check (centro_id = auth.uid());

create index if not exists idx_ct_centro on public.centro_terapeutas(centro_id);
create index if not exists idx_ct_terapeuta on public.centro_terapeutas(terapeuta_id);
