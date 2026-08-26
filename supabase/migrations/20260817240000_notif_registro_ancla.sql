-- La notificación de un registro nuevo lleva al registro concreto y abre su
-- recuadro para comentarlo (no al chat).
create or replace function public.notificar_registro()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
declare
  v_vinc      uuid;
  v_terapeuta uuid;
  v_paciente  text;
begin
  if new.privacidad not in ('compartido', 'marcado_sesion') then return new; end if;

  select id, terapeuta_id into v_vinc, v_terapeuta
  from public.vinculaciones
  where paciente_id = new.paciente_id and estado = 'activa'
  limit 1;

  if v_terapeuta is null then return new; end if;

  select nombre into v_paciente from public.profiles where id = new.paciente_id;

  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    v_terapeuta,
    'registro',
    coalesce(v_paciente, 'Un paciente') || ' compartió un registro',
    new.emocion_principal_key || ' · intensidad ' || new.intensidad || '/5',
    v_vinc,
    '/pacientes/' || v_vinc::text || '/registros?comentar=' || new.id::text
  );
  return new;
end $function$;
