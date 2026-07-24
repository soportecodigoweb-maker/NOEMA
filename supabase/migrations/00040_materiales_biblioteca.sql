-- =============================================================================
-- NOEMA · 00040 · Materiales de la biblioteca (lecturas, PDF, audios, enlaces)
-- =============================================================================
-- El terapeuta puede adjuntar materiales a un recurso de su biblioteca para
-- pasárselos al paciente: archivos (PDF, audio, imagen, documento) y enlaces.
--
-- · Los archivos viven en el bucket privado 'recursos', bajo la carpeta del
--   terapeuta: "<terapeuta_id>/<uuid>.<ext>".
-- · El metadato va en `plantillas_ejercicios.recursos` (jsonb, ya existía) y se
--   copia a `tareas.recursos` al asignar, para que viaje con la tarea.
--
-- Acceso: se resuelve con RLS (no con service_role). El terapeuta gestiona su
-- carpeta; el paciente con vinculación activa puede LEER los materiales de su
-- terapeuta (son materiales educativos hechos para él, no expediente clínico).
-- Idempotente.
-- =============================================================================

-- ── 1. Bucket privado 'recursos' ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('recursos', 'recursos', false)
on conflict (id) do nothing;

-- ── 2. Políticas de Storage ──────────────────────────────────────────────────
-- El terapeuta gestiona (subir/leer/borrar) solo su propia carpeta.
do $$ begin
  create policy recursos_storage_terapeuta on storage.objects
    for all
    using (
      bucket_id = 'recursos'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'recursos'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

-- El paciente con vinculación ACTIVA puede leer los materiales de su terapeuta.
do $$ begin
  create policy recursos_storage_paciente_lectura on storage.objects
    for select
    using (
      bucket_id = 'recursos'
      and exists (
        select 1 from public.vinculaciones v
        where v.paciente_id = auth.uid()
          and v.estado = 'activa'
          and (storage.foldername(name))[1] = v.terapeuta_id::text
      )
    );
exception when duplicate_object then null; end $$;

-- ── 3. Los materiales viajan con la tarea ────────────────────────────────────
alter table public.tareas
  add column if not exists recursos jsonb not null default '[]'::jsonb;

comment on column public.tareas.recursos is
  'Materiales adjuntos (archivos del bucket recursos y enlaces) copiados de la plantilla al asignar. Formato: [{tipo, titulo, ruta|url, mime, tamano}]';

comment on column public.plantillas_ejercicios.recursos is
  'Materiales del recurso: [{tipo: "archivo"|"enlace", titulo, ruta|url, mime, tamano}]';
