-- =============================================================================
-- NOEMA · 00037 · Nota clínica inicial / historia clínica (NOM-004) (#7)
-- =============================================================================
-- Nota de la primera sesión con los campos del expediente clínico inicial
-- según NOM-004-SSA3-2012 (adaptado a atención psicológica). Una por vínculo.
-- Contenido inmutable en el sentido de que forma parte del expediente.
-- =============================================================================

create table if not exists public.expediente_inicial (
  vinculacion_id            uuid primary key references public.vinculaciones(id) on delete cascade,
  -- Interrogatorio (NOM-004)
  motivo_consulta           text,
  padecimiento_actual       text,
  antecedentes_familiares   text,  -- heredofamiliares
  antecedentes_personales   text,  -- personales patológicos y no patológicos
  -- Exploración / examen mental
  examen_mental             text,
  -- Diagnóstico y plan
  impresion_diagnostica     text,
  plan_terapeutico          text,
  pronostico                text,
  -- Metadatos
  elaborado_por             uuid references public.profiles(id),
  fecha_elaboracion         date not null default current_date,
  actualizado_at            timestamptz not null default now()
);

comment on table public.expediente_inicial is
  'Nota clínica inicial (primera sesión) con campos NOM-004-SSA3-2012. Parte del expediente.';

alter table public.expediente_inicial enable row level security;

create trigger expediente_inicial_set_actualizado_at
  before update on public.expediente_inicial
  for each row execute function public.set_actualizado_at();

-- Solo el terapeuta de la vinculación gestiona el expediente inicial.
create policy expediente_inicial_terapeuta on public.expediente_inicial
  for all
  using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = expediente_inicial.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vinculaciones v
      where v.id = expediente_inicial.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  );
