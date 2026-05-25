-- =============================================================================
-- NOEMA · 00011 · Recursos asignados al paciente
-- =============================================================================
-- Cuando el terapeuta recomienda un contenido del catálogo al paciente,
-- se crea aquí. El paciente lo ve en su pantalla de Recursos.
-- =============================================================================

create table public.recursos_asignados (
  id                  uuid primary key default gen_random_uuid(),
  vinculacion_id      uuid not null references public.vinculaciones(id) on delete cascade,
  contenido_id        uuid not null references public.contenido_educativo(id) on delete cascade,
  asignado_por        uuid not null references public.profiles(id),
  mensaje_terapeuta   text,
  prioridad           int not null default 0,
  visto_at            timestamptz,
  creado_at           timestamptz not null default now(),
  unique (vinculacion_id, contenido_id)
);

create index recursos_asignados_vinculacion_idx on public.recursos_asignados(vinculacion_id, creado_at desc);

alter table public.recursos_asignados enable row level security;
