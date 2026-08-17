-- El paciente decide si cada meta la comparte con su terapeuta o la mantiene
-- privada. Por defecto: privada (el paciente decide qué comparte).

alter table public.recordatorios_personales
  add column if not exists compartida boolean not null default false;

comment on column public.recordatorios_personales.compartida is
  'true = el terapeuta puede verla; false = privada del paciente.';

-- El terapeuta vinculado puede LEER solo las metas compartidas.
drop policy if exists recordatorios_terapeuta_lectura on public.recordatorios_personales;
create policy recordatorios_terapeuta_lectura on public.recordatorios_personales
  for select
  using (
    compartida = true
    and exists (
      select 1 from public.vinculaciones v
      where v.paciente_id = recordatorios_personales.paciente_id
        and v.terapeuta_id = auth.uid()
        and v.estado in ('activa', 'pausada')
    )
  );
