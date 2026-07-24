-- =============================================================================
-- NOEMA · 00045 · Fotos de perfil (avatares) — cualquier rol (R4-4)
-- =============================================================================
-- Bucket público 'avatares' (las fotos de perfil son visibles por diseño).
-- Cada usuario sube/borra solo la suya, bajo la carpeta "<user_id>/…".
-- La URL pública se guarda en profiles.avatar_url. Idempotente.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

-- Lectura pública (bucket público).
do $$ begin
  create policy avatares_lectura_publica on storage.objects
    for select using (bucket_id = 'avatares');
exception when duplicate_object then null; end $$;

-- Cada quien gestiona su propia carpeta.
do $$ begin
  create policy avatares_propio_insert on storage.objects
    for insert with check (
      bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy avatares_propio_update on storage.objects
    for update using (
      bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy avatares_propio_delete on storage.objects
    for delete using (
      bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null; end $$;
