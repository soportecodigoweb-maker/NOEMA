-- Encuesta de satisfacción ocasional. La respuesta llega al Panel de Dueño.
-- Sirve para recoger retroalimentación (sobre todo de los terapeutas).

create table if not exists public.encuestas_satisfaccion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete set null,
  usuario_nombre text,
  rol text,
  calificacion int not null,
  comentario text,
  creado_at timestamptz not null default now(),
  constraint encuesta_calif_chk check (calificacion between 1 and 5)
);

alter table public.encuestas_satisfaccion enable row level security;

drop policy if exists encuesta_propia on public.encuestas_satisfaccion;
create policy encuesta_propia on public.encuestas_satisfaccion
  for all
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create index if not exists idx_encuesta_creado on public.encuestas_satisfaccion(creado_at desc);
