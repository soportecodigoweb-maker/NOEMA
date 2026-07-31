-- Informe que el terapeuta comparte CON el propio paciente (no diagnóstico).
-- El terapeuta lo genera (con IA opcional), lo edita y lo comparte; el paciente
-- lo ve en su sección de Documentos.

create table if not exists public.informes_paciente (
  id uuid primary key default gen_random_uuid(),
  vinculacion_id uuid not null references public.vinculaciones(id) on delete cascade,
  titulo text not null,
  contenido text not null,
  creado_por uuid references public.profiles(id) on delete set null,
  compartido_at timestamptz not null default now(),
  visto_at timestamptz
);

alter table public.informes_paciente enable row level security;

drop policy if exists informes_pac_terapeuta on public.informes_paciente;
create policy informes_pac_terapeuta on public.informes_paciente
  for all
  using (exists (select 1 from public.vinculaciones v where v.id = vinculacion_id and v.terapeuta_id = auth.uid()))
  with check (exists (select 1 from public.vinculaciones v where v.id = vinculacion_id and v.terapeuta_id = auth.uid()));

drop policy if exists informes_pac_paciente_sel on public.informes_paciente;
create policy informes_pac_paciente_sel on public.informes_paciente
  for select
  using (exists (select 1 from public.vinculaciones v where v.id = vinculacion_id and v.paciente_id = auth.uid()));

create index if not exists idx_informes_pac_vinc on public.informes_paciente(vinculacion_id);
