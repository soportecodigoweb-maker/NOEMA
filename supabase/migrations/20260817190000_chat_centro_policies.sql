-- El chat centro↔terapeuta no funcionaba: la tabla solo tenía política para el
-- terapeuta, así que el CENTRO no podía leer ni escribir sus mensajes.

drop policy if exists mensajes_centro on public.centro_mensajes;
create policy mensajes_centro on public.centro_mensajes
  for all
  using (centro_id = auth.uid())
  with check (centro_id = auth.uid());

-- El centro gestiona sus anuncios.
drop policy if exists anuncios_centro on public.centro_anuncios;
create policy anuncios_centro on public.centro_anuncios
  for all
  using (centro_id = auth.uid())
  with check (centro_id = auth.uid());

-- Realtime para que el chat se vea al instante en ambos lados.
alter publication supabase_realtime add table public.centro_mensajes;
