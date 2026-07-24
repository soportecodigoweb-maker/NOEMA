-- =============================================================================
-- NOEMA · 00046 · Plantillas oficiales editables por cada terapeuta (R4-6)
-- =============================================================================
-- Antes: las plantillas oficiales (terapeuta_id null) eran compartidas y de solo
-- lectura, así que editarlas exigía "duplicar". Ahora cada terapeuta recibe su
-- PROPIA copia editable de cada plantilla oficial, de forma transparente: en su
-- biblioteca solo ve las suyas y las edita directo, sin duplicar.
--
-- La copia guarda `origen_plantilla_id` para no duplicarla dos veces.
-- Idempotente.
-- =============================================================================

alter table public.plantillas_ejercicios
  add column if not exists origen_plantilla_id uuid references public.plantillas_ejercicios(id) on delete set null;

comment on column public.plantillas_ejercicios.origen_plantilla_id is
  'Si es copia de una plantilla oficial, apunta a la original (para no re-copiar).';

create index if not exists plantillas_origen_idx
  on public.plantillas_ejercicios (terapeuta_id, origen_plantilla_id);

/**
 * Asegura que el terapeuta en sesión tenga su copia editable de cada plantilla
 * oficial (terapeuta_id null). Copia solo las que aún no tenga. Idempotente.
 * Devuelve cuántas copió.
 */
create or replace function public.asegurar_plantillas_terapeuta()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_terapeuta uuid := auth.uid();
  v_copiadas  integer := 0;
begin
  if v_terapeuta is null then return 0; end if;

  -- Solo terapeutas.
  if not exists (select 1 from public.terapeutas where profile_id = v_terapeuta) then
    return 0;
  end if;

  insert into public.plantillas_ejercicios
    (terapeuta_id, origen_plantilla_id, titulo, descripcion, categoria, contenido_md,
     campos_respuesta, recursos, tipo, duracion_min, publica)
  select
    v_terapeuta, o.id, o.titulo, o.descripcion, o.categoria, o.contenido_md,
    o.campos_respuesta, o.recursos, o.tipo, o.duracion_min, false
  from public.plantillas_ejercicios o
  where o.terapeuta_id is null
    and not exists (
      select 1 from public.plantillas_ejercicios p
      where p.terapeuta_id = v_terapeuta and p.origen_plantilla_id = o.id
    );

  get diagnostics v_copiadas = row_count;
  return v_copiadas;
end $$;

revoke all on function public.asegurar_plantillas_terapeuta() from public, anon;
grant execute on function public.asegurar_plantillas_terapeuta() to authenticated;
