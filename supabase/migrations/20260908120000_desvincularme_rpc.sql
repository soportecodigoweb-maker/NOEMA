-- Permite que el propio paciente termine su vínculo desde la app móvil.
-- El trigger proteger_columnas_vinculacion impide que el paciente cambie
-- 'estado'. Añadimos un "bypass" por variable de sesión que SOLO la función
-- SECURITY DEFINER de abajo puede activar (el paciente por su cuenta no puede).

create or replace function public.proteger_columnas_vinculacion()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
begin
  -- Bypass controlado (solo lo activa la RPC desvincularme()).
  if current_setting('noema.bypass_proteccion', true) = '1' then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if auth.uid() = old.terapeuta_id then
    return new;
  end if;

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
end $function$;

-- RPC: el paciente autenticado termina su vínculo activo.
create or replace function public.desvincularme()
  returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_vinc uuid;
  v_ter  uuid;
  v_nom  text;
begin
  select id, terapeuta_id into v_vinc, v_ter
  from vinculaciones
  where paciente_id = auth.uid() and estado in ('activa', 'pausada')
  order by fecha_inicio desc
  limit 1;

  if v_vinc is null then return; end if;

  perform set_config('noema.bypass_proteccion', '1', true);
  update vinculaciones set estado = 'finalizada', fecha_fin = now() where id = v_vinc;
  update profiles set rol = 'sin_terapeuta' where id = auth.uid();

  if v_ter is not null then
    select nombre into v_nom from profiles where id = auth.uid();
    insert into notificaciones (destinatario_id, tipo, titulo, cuerpo, url)
    values (v_ter, 'vinculacion', 'Un paciente se desvinculó',
            coalesce(v_nom, 'Un paciente') || ' decidió terminar el vínculo contigo.', '/pacientes');
  end if;
end $function$;

grant execute on function public.desvincularme() to authenticated;
