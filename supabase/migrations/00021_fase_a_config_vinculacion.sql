-- =============================================================================
-- NOEMA · 00021 · Fase A — Configuración por vínculo (riesgo, SOS, agenda)
-- =============================================================================
-- Requerimientos del terapeuta:
--   #8  nivel de riesgo por paciente (color + filtro)
--   #9  habilitar / deshabilitar botón SOS del paciente
--   #13 habilitar / deshabilitar que el paciente agende citas
--
-- Además: fix del hallazgo crítico de seguridad #4 — el paciente NO puede
-- modificar columnas que son control exclusivo del terapeuta.
-- =============================================================================

-- Nivel de riesgo clínico del paciente (lo evalúa el terapeuta) ---------------
do $$ begin
  create type nivel_riesgo as enum ('sin_evaluar', 'bajo', 'medio', 'alto', 'critico');
exception when duplicate_object then null; end $$;

comment on type nivel_riesgo is
  'Nivel de complejidad/riesgo que el terapeuta asigna a un paciente. Se usa para color + filtro en el panel. NO es diagnóstico clínico, es triage operativo.';

alter table public.vinculaciones
  add column if not exists nivel_riesgo      nivel_riesgo not null default 'sin_evaluar',
  add column if not exists nivel_riesgo_nota text,                    -- por qué se asignó ese nivel
  add column if not exists sos_habilitado    boolean not null default true,   -- #9
  add column if not exists agenda_habilitada boolean not null default false;  -- #13

comment on column public.vinculaciones.sos_habilitado is
  'Si el terapeuta habilita el botón S.O.S. del paciente en la app. Default true (seguridad).';
comment on column public.vinculaciones.agenda_habilitada is
  'Si el paciente puede agendar citas por su cuenta. Default false (el terapeuta lo activa).';

create index if not exists vinculaciones_nivel_riesgo_idx
  on public.vinculaciones(terapeuta_id, nivel_riesgo);

-- =============================================================================
-- Fix crítico #4: proteger columnas control-del-terapeuta de updates del paciente
-- =============================================================================
-- La política `vinculaciones_paciente_update` deja al paciente hacer UPDATE de
-- su fila, pero RLS no restringe columnas. Sin esto el paciente podría
-- reasignarse de terapeuta, apagarse el SOS, cambiar su nivel de riesgo, etc.
--
-- Solución: trigger BEFORE UPDATE que, cuando el actor es el paciente (no el
-- terapeuta dueño), fuerza a que las columnas protegidas conserven su valor OLD.

create or replace function public.proteger_columnas_vinculacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si quien actualiza es el terapeuta dueño, se permite todo.
  if auth.uid() = old.terapeuta_id then
    return new;
  end if;

  -- Cualquier otro actor (el paciente) NO puede tocar estas columnas:
  new.terapeuta_id              := old.terapeuta_id;
  new.estado                    := old.estado;
  new.facturable                := old.facturable;
  new.ultimo_periodo_facturado  := old.ultimo_periodo_facturado;
  new.nivel_riesgo              := old.nivel_riesgo;
  new.nivel_riesgo_nota         := old.nivel_riesgo_nota;
  new.sos_habilitado            := old.sos_habilitado;
  new.agenda_habilitada         := old.agenda_habilitada;
  new.codigo_invitacion         := old.codigo_invitacion;
  new.fecha_inicio              := old.fecha_inicio;
  new.consentimiento_aceptado_at := coalesce(new.consentimiento_aceptado_at, old.consentimiento_aceptado_at);

  return new;
end;
$$;

drop trigger if exists vinculaciones_proteger_columnas on public.vinculaciones;
create trigger vinculaciones_proteger_columnas
  before update on public.vinculaciones
  for each row execute function public.proteger_columnas_vinculacion();
