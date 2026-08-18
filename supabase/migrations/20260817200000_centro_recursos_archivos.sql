-- Recursos del centro para sus terapeutas: además de enlaces, ahora se pueden
-- subir archivos (PDF, imágenes, videos).

alter table public.centro_recursos
  add column if not exists ruta text,
  add column if not exists tipo_mime text,
  add column if not exists tamano_bytes bigint;

-- El centro gestiona sus recursos.
drop policy if exists recursos_centro_all on public.centro_recursos;
create policy recursos_centro_all on public.centro_recursos
  for all
  using (centro_id = auth.uid())
  with check (centro_id = auth.uid());

-- Bucket público para materiales del centro (no contienen datos clínicos).
insert into storage.buckets (id, name, public, file_size_limit)
values ('centro-recursos', 'centro-recursos', true, 104857600)
on conflict (id) do update set public = true, file_size_limit = 104857600;

-- Solo el centro dueño puede subir/borrar en su carpeta.
drop policy if exists centro_recursos_storage on storage.objects;
create policy centro_recursos_storage on storage.objects
  for all
  using (bucket_id = 'centro-recursos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'centro-recursos' and (storage.foldername(name))[1] = auth.uid()::text);
