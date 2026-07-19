-- =============================================================================
-- NOEMA · 00026 · Fix: el trigger de protección de columnas debe eximir al
-- service_role (admin, edge functions, seeds).
-- =============================================================================
-- Bug: proteger_columnas_vinculacion (migration 00021) revierte cambios a
-- columnas protegidas cuando auth.uid() != terapeuta_id. Pero el service_role
-- tiene auth.uid() = NULL, así que también quedaba bloqueado — impidiendo que
-- scripts admin y edge functions gestionen vinculaciones (nivel_riesgo, estado,
-- facturación, etc.).
--
-- Fix: eximir explícitamente al service_role. La protección sigue aplicando al
-- paciente (rol authenticated cuyo uid != terapeuta_id).

create or replace function public.proteger_columnas_vinculacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- El service_role (admin, edge functions, seeds) puede cambiar todo.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- El terapeuta dueño puede cambiar todo.
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
