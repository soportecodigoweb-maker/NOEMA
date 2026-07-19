-- =============================================================================
-- NOEMA · 00031 · Adjuntos del expediente (req terapeuta #5)
-- =============================================================================
-- El terapeuta puede adjuntar archivos (imágenes, PDFs escaneados) al expediente
-- del paciente. Los archivos viven en el bucket 'adjuntos' (Storage), y esta
-- tabla guarda el metadato + la ruta.
--
-- Inmutabilidad (#5): NO se borran adjuntos; se marcan como archivados.
-- =============================================================================

create table if not exists public.adjuntos (
  id            uuid primary key default gen_random_uuid(),
  vinculacion_id uuid not null references public.vinculaciones(id) on delete cascade,
  subido_por    uuid not null references public.profiles(id),
  -- Ruta dentro del bucket 'adjuntos' (ej. "<vinculacion_id>/<uuid>.pdf")
  ruta          text not null,
  nombre        text not null,
  tipo_mime     text,
  tamano_bytes  bigint,
  descripcion   text,
  archivado     boolean not null default false, -- soft-delete (nada se borra)
  creado_at     timestamptz not null default now()
);

comment on table public.adjuntos is
  'Adjuntos del expediente (imágenes, PDFs). Inmutable: se archivan, no se borran.';

create index if not exists adjuntos_vinculacion_idx
  on public.adjuntos(vinculacion_id, creado_at desc);

alter table public.adjuntos enable row level security;

-- El terapeuta de la vinculación gestiona los adjuntos.
create policy adjuntos_terapeuta_all on public.adjuntos
  for all
  using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = adjuntos.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vinculaciones v
      where v.id = adjuntos.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  );

-- =============================================================================
-- Políticas de Storage para el bucket 'adjuntos'
-- =============================================================================
-- Estructura de rutas: "<vinculacion_id>/<archivo>". El terapeuta de esa
-- vinculación puede leer/escribir; nadie más.

do $$ begin
  create policy adjuntos_storage_terapeuta on storage.objects
    for all
    using (
      bucket_id = 'adjuntos'
      and exists (
        select 1 from public.vinculaciones v
        where v.terapeuta_id = auth.uid()
          and (storage.foldername(name))[1] = v.id::text
      )
    )
    with check (
      bucket_id = 'adjuntos'
      and exists (
        select 1 from public.vinculaciones v
        where v.terapeuta_id = auth.uid()
          and (storage.foldername(name))[1] = v.id::text
      )
    );
exception when duplicate_object then null; end $$;
