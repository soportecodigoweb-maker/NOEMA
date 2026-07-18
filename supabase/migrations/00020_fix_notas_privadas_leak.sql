-- Fix crítico: notas_terapeuta_privadas leak vía RLS.
--
-- Bug: la columna `notas_terapeuta_privadas` de la tabla `vinculaciones` era
-- accesible al paciente porque RLS es row-level, no column-level. La política
-- `vinculaciones_paciente_select` permitía al paciente SELECT * de su fila,
-- incluyendo ese campo que la UI del terapeuta promete "solo tú puedes ver".
--
-- Fix: revocar SELECT sobre esa columna específica a `authenticated` y
-- otorgarlo solo cuando el rol sea terapeuta (usando RLS via policy).
-- La forma más simple y auditable: mover la columna a una tabla separada.

-- Crear tabla separada para notas privadas del terapeuta sobre el vínculo.
create table if not exists public.vinculacion_notas_privadas (
  vinculacion_id uuid primary key references public.vinculaciones(id) on delete cascade,
  contenido text not null default '',
  actualizado_at timestamptz not null default now()
);

alter table public.vinculacion_notas_privadas enable row level security;

-- Solo el terapeuta dueño del vínculo puede leer/escribir sus notas.
create policy vinculacion_notas_priv_terapeuta_all
  on public.vinculacion_notas_privadas
  for all
  using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = vinculacion_notas_privadas.vinculacion_id
        and v.terapeuta_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vinculaciones v
      where v.id = vinculacion_notas_privadas.vinculacion_id
        and v.terapeuta_id = auth.uid()
    )
  );

-- Migrar datos existentes.
insert into public.vinculacion_notas_privadas (vinculacion_id, contenido)
select id, coalesce(notas_terapeuta_privadas, '')
from public.vinculaciones
where notas_terapeuta_privadas is not null and notas_terapeuta_privadas <> ''
on conflict (vinculacion_id) do nothing;

-- Eliminar la columna original de vinculaciones (ya no debe existir).
alter table public.vinculaciones drop column if exists notas_terapeuta_privadas;
