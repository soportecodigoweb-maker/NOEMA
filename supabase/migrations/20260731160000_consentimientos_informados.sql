-- Consentimiento informado que el terapeuta envía al paciente para que lo firme.
-- El paciente lo lee y lo firma (acepta con su nombre); queda registro con fecha.

create table if not exists public.consentimientos_informados (
  id uuid primary key default gen_random_uuid(),
  vinculacion_id uuid not null references public.vinculaciones(id) on delete cascade,
  titulo text not null,
  contenido text not null,
  creado_por uuid references public.profiles(id) on delete set null,
  enviado_at timestamptz not null default now(),
  firmado_at timestamptz,
  firma_nombre text
);

alter table public.consentimientos_informados enable row level security;

-- El terapeuta dueño de la vinculación gestiona (crea, ve, borra) el documento.
drop policy if exists consentimientos_inf_terapeuta on public.consentimientos_informados;
create policy consentimientos_inf_terapeuta on public.consentimientos_informados
  for all
  using (exists (select 1 from public.vinculaciones v where v.id = vinculacion_id and v.terapeuta_id = auth.uid()))
  with check (exists (select 1 from public.vinculaciones v where v.id = vinculacion_id and v.terapeuta_id = auth.uid()));

-- El paciente puede ver los documentos de su vinculación (la firma va por acción admin).
drop policy if exists consentimientos_inf_paciente_sel on public.consentimientos_informados;
create policy consentimientos_inf_paciente_sel on public.consentimientos_informados
  for select
  using (exists (select 1 from public.vinculaciones v where v.id = vinculacion_id and v.paciente_id = auth.uid()));

create index if not exists idx_consent_inf_vinc on public.consentimientos_informados(vinculacion_id);
