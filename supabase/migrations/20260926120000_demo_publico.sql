-- =============================================================================
-- NOEMA · Demo público (sandbox por visitante)
-- =============================================================================
-- No hay cuenta maestra. Cada visitante que entra al demo recibe su propia
-- pareja de cuentas reales (psicóloga demo + paciente demo, más tres pacientes
-- de relleno) con tres meses de historia clínica ficticia y creíble. Nadie ve
-- lo de otro; "Reiniciar demo" vuelve a sembrar la historia del visitante, y
-- un job nocturno borra a todos los visitantes del día.
--
-- Solo el servidor (service_role) puede llamar estas funciones. Ninguna cuenta
-- real se toca: los usuarios demo llevan profiles.demo_visitante y correos
-- únicos bajo @demo.noema.app.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ── Marca de cuenta demo ─────────────────────────────────────────────────────
alter table public.profiles add column if not exists demo_visitante uuid;
create index if not exists profiles_demo_visitante_idx on public.profiles (demo_visitante) where demo_visitante is not null;

-- ── Registro de visitantes ───────────────────────────────────────────────────
create table if not exists public.demo_visitantes (
  id uuid primary key,
  terapeuta_id uuid not null,
  paciente_id uuid not null,
  vinculacion_id uuid,
  usuarios uuid[] not null default '{}',
  ip_hash text,
  creado_at timestamptz not null default now(),
  reiniciado_at timestamptz
);
alter table public.demo_visitantes enable row level security; -- sin políticas: solo service_role

-- =============================================================================
-- Usuario de auth creado desde SQL (GoTrue acepta filas insertadas así).
-- =============================================================================
create or replace function public.demo_insertar_usuario(
  p_id uuid, p_email text, p_password text, p_nombre text, p_rol public.rol_usuario, p_visitante uuid
) returns void
language plpgsql security definer set search_path = public as $fn$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nombre', p_nombre, 'rol', case when p_rol = 'paciente' then 'paciente' else 'sin_terapeuta' end),
    now(), now(), '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());

  -- El trigger de auth ya creó el profile; lo completamos.
  update public.profiles
     set rol = p_rol, nombre = p_nombre, onboarding_completo = true,
         modo_aprendiz = false, demo_visitante = p_visitante, ciudad = 'Ciudad de México'
   where id = p_id;

  -- Avisos legales aceptados (web v3 y móvil v1) para no topar con las pantallas de aviso.
  insert into public.consentimientos (profile_id, tipo, version, aceptado, texto_resumen)
  values (p_id, 'aviso_privacidad', '2026-07-v3', true, 'Aceptado en cuenta demo'),
         (p_id, 'aviso_privacidad', '2026-07-v1', true, 'Aceptado en cuenta demo'),
         (p_id, 'terminos_servicio', '2026-05-v1', true, 'Aceptado en cuenta demo');
end;
$fn$;

-- =============================================================================
-- Borrar el contenido del visitante (conserva a la psicóloga y a la paciente).
-- =============================================================================
create or replace function public.demo_borrar_contenido(p_visitante uuid) returns void
language plpgsql security definer set search_path = public as $fn$
declare
  v record;
  extra uuid;
begin
  select * into v from public.demo_visitantes where id = p_visitante;
  if not found then return; end if;

  perform set_config('noema.bypass_proteccion', '1', true);

  -- Pacientes de relleno: se borran por completo (cascada desde auth.users).
  foreach extra in array v.usuarios loop
    if extra <> v.terapeuta_id and extra <> v.paciente_id then
      delete from auth.users where id = extra;
    end if;
  end loop;

  -- Vinculaciones de la psicóloga (arrastran sesiones, tareas, mensajes, plan de apoyo, etc.).
  delete from public.vinculaciones where terapeuta_id = v.terapeuta_id;
  -- Lo propio de la paciente.
  delete from public.registros_emocionales where paciente_id = v.paciente_id;
  delete from public.diario_entradas where paciente_id = v.paciente_id;
  delete from public.recordatorios_personales where paciente_id = v.paciente_id;
  delete from public.mensajes_noema where paciente_id = v.paciente_id;
  delete from public.contactos_confianza where paciente_id = v.paciente_id;
  -- Lo propio de la psicóloga.
  delete from public.pagos_pacientes where terapeuta_id = v.terapeuta_id;
  delete from public.finanzas_movimientos where terapeuta_id = v.terapeuta_id;
  delete from public.finanzas_activos where terapeuta_id = v.terapeuta_id;
  delete from public.finanzas_config where terapeuta_id = v.terapeuta_id;
  delete from public.mensajes_rapidos where terapeuta_id = v.terapeuta_id;
  delete from public.terapeuta_horarios where terapeuta_id = v.terapeuta_id;
  delete from public.notificaciones where destinatario_id in (v.terapeuta_id, v.paciente_id);
  delete from public.encuestas_satisfaccion where usuario_id in (v.terapeuta_id, v.paciente_id);
  delete from public.push_suscripciones where user_id in (v.terapeuta_id, v.paciente_id);
  delete from public.push_tokens where user_id in (v.terapeuta_id, v.paciente_id);

  update public.demo_visitantes set usuarios = array[v.terapeuta_id, v.paciente_id] where id = p_visitante;
end;
$fn$;

-- =============================================================================
-- Sembrar la historia clínica del visitante.
-- =============================================================================
create or replace function public.demo_sembrar_contenido(p_visitante uuid) returns void
language plpgsql security definer set search_path = public as $fn$
declare
  v record;
  t uuid;   -- psicóloga
  p uuid;   -- paciente principal (Mariana)
  vinc uuid;
  d int; i int; n int; r int; fase int;
  clave text; inten int; priv public.nivel_privacidad; h time;
  ses uuid; tarea1 uuid; tarea2 uuid; tarea3 uuid; tarea4 uuid;
  extra_p uuid; extra_v uuid; k int;
  nombres text[] := array['Diego Ramírez', 'Lucía Peña', 'Carmen Valdés'];
  riesgos public.nivel_riesgo[] := array['medio', 'bajo', 'alto'];
  ocup text[] := array['Ingeniero de software', 'Estudiante de posgrado', 'Enfermera'];
  motivos text[][] := array[array['estres', 'sueno'], array['autoestima', 'relaciones'], array['depresion', 'duelo']];
  ts_mx timestamptz;
  hoy date := current_date;
  tiene_push_expo boolean; tiene_push_web boolean;
begin
  select * into v from public.demo_visitantes where id = p_visitante;
  if not found then raise exception 'visitante demo inexistente'; end if;
  t := v.terapeuta_id; p := v.paciente_id;

  perform set_config('noema.bypass_proteccion', '1', true);

  -- Mientras sembramos, sin disparar push (no hay dispositivos demo; evita
  -- cientos de llamadas HTTP). Los triggers se reactivan al final.
  select exists(select 1 from pg_trigger where tgname = 'trg_push_notificacion' and tgrelid = 'public.notificaciones'::regclass) into tiene_push_expo;
  select exists(select 1 from pg_trigger where tgname = 'trg_push_web_al_instante' and tgrelid = 'public.notificaciones'::regclass) into tiene_push_web;
  if tiene_push_expo then execute 'alter table public.notificaciones disable trigger trg_push_notificacion'; end if;
  if tiene_push_web then execute 'alter table public.notificaciones disable trigger trg_push_web_al_instante'; end if;

  -- ── Psicóloga ──────────────────────────────────────────────────────────────
  insert into public.terapeutas (profile_id, cedula_profesional, titulo, descripcion, especialidades, enfoques,
                                 modalidades, experiencia_anios, precio_sesion_mxn, estado_verificacion, verificado_at, plan, plan_estado)
  values (t, 'DEMO-' || left(p_visitante::text, 8), 'Lic. en Psicología · Terapia cognitivo-conductual',
          'Acompaño a adultos con ansiedad, exigencia excesiva y dificultades en sus relaciones. Trabajo con herramientas concretas entre sesión y sesión.',
          array['Ansiedad', 'Autoestima', 'Relaciones', 'Estrés laboral'], array['Cognitivo-conductual', 'ACT', 'Mindfulness'],
          array['online', 'presencial']::public.modalidad_sesion[], 9, 850, 'verificado', now() - interval '80 days', 'activo', 'activa')
  on conflict (profile_id) do update set titulo = excluded.titulo;

  insert into public.configuracion_terapeuta (terapeuta_id, sos_habilitado, chat_habilitado, agenda_habilitada, diario_habilitado,
                                              registros_habilitados, tareas_habilitadas, progreso_habilitado, mensajes_ia_habilitados, notif_paciente)
  values (t, true, true, true, true, true, true, true, true, true)
  on conflict (terapeuta_id) do update set sos_habilitado = true, agenda_habilitada = true;

  insert into public.terapeuta_horarios (terapeuta_id, dia_semana, hora_inicio, hora_fin, modalidad)
  values (t, 1, '10:00', '14:00', 'online'), (t, 2, '16:00', '20:00', 'presencial'), (t, 3, '10:00', '14:00', 'online'),
         (t, 4, '16:00', '20:00', 'online'), (t, 5, '10:00', '13:00', 'presencial');

  insert into public.mensajes_rapidos (terapeuta_id, texto, orden) values
    (t, 'Gracias por compartirlo. Lo vemos con calma en la sesión.', 0),
    (t, 'Recuerda la respiración 4-7-8 antes de dormir. ¿Cómo te fue hoy?', 1),
    (t, 'Estoy en consulta; te respondo en cuanto termine.', 2);

  insert into public.finanzas_config (terapeuta_id, tasa_impuesto_pct) values (t, 30) on conflict (terapeuta_id) do nothing;

  -- ── Paciente principal: Mariana ────────────────────────────────────────────
  insert into public.pacientes (profile_id, fecha_nacimiento, genero, ocupacion, motivos_consulta)
  values (p, hoy - interval '31 years', 'mujer', 'Coordinadora de proyectos', array['ansiedad', 'autoestima', 'relaciones'])
  on conflict (profile_id) do nothing;

  insert into public.vinculaciones (terapeuta_id, paciente_id, codigo_invitacion, email_invitado, nombre_invitado, estado,
                                    fecha_inicio, consentimiento_aceptado_at, version_consentimiento, notificar_crisis_terapeuta,
                                    nivel_riesgo, nivel_riesgo_nota, telefono_terapeuta)
  values (t, p, 'DEMO-' || upper(left(md5(p_visitante::text), 4)), null, 'Mariana Soto', 'activa',
          now() - interval '88 days', now() - interval '88 days', '2026-05-v1', true,
          'medio', 'Ansiedad anticipatoria con episodios de sobrecarga. Sin ideación. Reevaluar cada mes.', '55 1234 5678')
  returning id into vinc;
  update public.vinculaciones set sos_habilitado = true, agenda_habilitada = true, chat_habilitado = true, diario_habilitado = true,
         registros_habilitados = true, tareas_habilitadas = true, progreso_habilitado = true, mensajes_ia_habilitados = true
   where id = vinc;
  update public.demo_visitantes set vinculacion_id = vinc where id = p_visitante;

  -- Registros emocionales: 90 días con arco de mejora (más malestar al inicio).
  for d in reverse 89..0 loop
    n := case when (d * 37) % 10 < 2 then 0 when (d * 37) % 10 < 7 then 1 else 2 end;
    fase := case when d > 60 then 1 when d > 30 then 2 else 3 end;
    for i in 1..n loop
      r := (d * 7919 + i * 104729) % 100;
      if fase = 1 then
        clave := case when r < 20 then 'ansioso' when r < 35 then 'preocupado' when r < 45 then 'abrumado'
                      when r < 58 then 'cansado' when r < 65 then 'agotado' when r < 74 then 'triste' when r < 80 then 'solo'
                      when r < 92 then 'tranquilo' else 'satisfecho' end;
      elsif fase = 2 then
        clave := case when r < 18 then 'ansioso' when r < 30 then 'preocupado' when r < 35 then 'abrumado'
                      when r < 48 then 'cansado' when r < 58 then 'triste' when r < 75 then 'tranquilo' when r < 85 then 'en_paz'
                      when r < 93 then 'feliz' else 'satisfecho' end;
      else
        clave := case when r < 12 then 'ansioso' when r < 22 then 'preocupado' when r < 32 then 'cansado' when r < 40 then 'triste'
                      when r < 60 then 'tranquilo' when r < 72 then 'en_paz' when r < 82 then 'feliz' when r < 92 then 'agradecido'
                      else 'orgulloso' end;
      end if;
      inten := case
        when clave in ('ansioso', 'preocupado', 'abrumado', 'triste', 'solo', 'agotado') then least(5, 2 + (r % 3) + (case when fase = 1 then 1 else 0 end))
        else 2 + (r % 3) end;
      priv := case when r % 9 = 0 then 'privado' when r % 13 = 0 then 'marcado_sesion' else 'compartido' end;
      h := case when i = 1 then make_time(8 + (r % 3), (r * 7) % 60, 0) else make_time(19 + (r % 3), (r * 11) % 60, 0) end;
      ts_mx := ((hoy - d) + h)::timestamp at time zone 'America/Mexico_City';
      insert into public.registros_emocionales (paciente_id, fecha, hora, registrado_at, emocion_principal_key, intensidad, privacidad,
                                                situacion_detonante, creado_at)
      values (p, hoy - d, h, ts_mx, clave, inten, priv,
              case when clave in ('ansioso', 'preocupado', 'abrumado') and r % 2 = 0 then 'Trabajo'
                   when clave in ('triste', 'solo') then 'Familia' when clave = 'cansado' then 'Dormí poco' else null end,
              ts_mx);
    end loop;
  end loop;

  -- Registros con voz propia (los que cuentan la historia).
  insert into public.registros_emocionales (paciente_id, fecha, hora, registrado_at, emocion_principal_key, intensidad, privacidad, descripcion, situacion_detonante, pensamientos, sensaciones_fisicas, necesidad, creado_at)
  select p, hoy - x.d, x.h, ((hoy - x.d) + x.h)::timestamp at time zone 'America/Mexico_City', x.k, x.i, x.pr::public.nivel_privacidad, x.desc_, x.det, x.pens, x.sens, x.nec, ((hoy - x.d) + x.h)::timestamp at time zone 'America/Mexico_City'
  from (values
    (86, time '22:10', 'abrumado', 5, 'marcado_sesion', 'Llevo tres noches sin dormir bien por la entrega del proyecto. Siento que si fallo se cae todo.', 'Trabajo', 'Si no lo hago perfecto me van a correr.', 'Presión en el pecho, manos frías', 'Que alguien me diga que está bien parar', null),
    (79, time '09:15', 'preocupado', 4, 'compartido', 'Mi mamá me llamó para preguntar por qué no he ido a verla. Otra vez la culpa.', 'Familia', 'Soy una mala hija.', 'Nudo en la garganta', null, null),
    (72, time '20:40', 'tranquilo', 2, 'compartido', 'Hice el ejercicio de respiración que vimos. Me costó al principio y luego bajó.', null, null, null, null, null),
    (61, time '23:30', 'ansioso', 5, 'marcado_sesion', 'Crisis de ansiedad después de la junta. Sentí que no podía respirar. Esto sí lo quiero hablar en sesión.', 'Pensamientos catastróficos', 'Todos se dieron cuenta de que no sé lo que hago.', 'Taquicardia, mareo', 'Entender qué la disparó', null),
    (58, time '08:30', 'cansado', 3, 'compartido', 'Resaca emocional de la crisis. Hoy solo quiero ir despacio.', 'Dormí poco', null, null, null, null),
    (50, time '19:00', 'triste', 3, 'privado', 'Me sentí muy sola hoy sin saber bien por qué.', null, null, null, null, null),
    (44, time '21:05', 'satisfecho', 4, 'compartido', 'Le dije a mi jefa que no podía tomar el proyecto extra. Temblé, pero lo dije.', 'Trabajo', 'Puedo poner límites sin que se acabe el mundo.', null, null, null),
    (37, time '10:20', 'preocupado', 3, 'marcado_sesion', 'Pensar en el cumpleaños de mi mamá el sábado me pone tensa. No sé cómo estar ahí sin discutir.', 'Familia', null, 'Hombros apretados', 'Un plan para el sábado', null),
    (30, time '18:45', 'feliz', 4, 'compartido', 'Fui al parque sola y la pasé bien. Hace meses no hacía algo solo porque sí.', null, null, null, null, null),
    (23, time '01:40', 'abrumado', 5, 'compartido', 'Discusión fuerte con Andrés. Usé el plan de apoyo: llamé a mi hermana y respiré. Ya pasó.', 'Pareja', 'No puedo con esto sola.', 'Temblor, llanto', 'Compañía', null),
    (16, time '09:00', 'en_paz', 2, 'compartido', 'Dormí siete horas seguidas. Desperté sin la alarma interna.', null, null, null, null, null),
    (9, time '20:15', 'orgulloso', 4, 'compartido', 'Terminé la carta que me dejaste de tarea. Lloré, pero de alivio.', null, null, null, null, null),
    (4, time '13:30', 'ansioso', 3, 'compartido', 'Nervios antes de presentar. Usé la respiración y pude entrar a la sala.', 'Trabajo', 'Puedo estar nerviosa y hacerlo de todos modos.', null, null, null),
    (1, time '22:00', 'agradecido', 3, 'compartido', 'Hoy no fue un buen día, pero no me lo llevé a la cama. Lo escribí y lo solté.', null, null, null, null, null),
    (0, time '08:20', 'tranquilo', 2, 'compartido', 'Lista para la sesión del jueves. Traigo dos cosas marcadas para hablar.', null, null, null, null, null)
  ) as x(d, h, k, i, pr, desc_, det, pens, sens, nec, extra_);

  -- Retroalimentación de la psicóloga a un par de registros compartidos.
  update public.registros_emocionales set retroalimentacion = 'Qué importante que lo hayas dicho en voz alta. Lo retomamos el jueves.',
         retroalimentacion_at = registrado_at + interval '3 hours', retroalimentacion_por = t
   where paciente_id = p and fecha = hoy - 44;
  update public.registros_emocionales set retroalimentacion = 'Usaste el plan tal como lo armamos. Eso es cuidarte.',
         retroalimentacion_at = registrado_at + interval '7 hours', retroalimentacion_por = t
   where paciente_id = p and fecha = hoy - 23;

  -- Diario.
  insert into public.diario_entradas (paciente_id, fecha, titulo, contenido, privacidad, creado_at) values
    (p, hoy - 84, 'No puedo dejar de pensar en lo que me dijo', 'Le doy vueltas y vueltas. Que si lo dijo en serio, que si fue solo un comentario. ¿Por qué me afecta tanto? Me cuesta pedir lo que necesito en el trabajo y termino sintiéndome menos.', 'compartido', (hoy - 84)::timestamp + interval '22 hours'),
    (p, hoy - 70, 'Algo que no le he dicho a nadie', 'A veces siento que estoy demasiado cansada de fingir que todo está bien. Pero también me da miedo dejar de hacerlo. Si paro, ¿qué queda?', 'privado', (hoy - 70)::timestamp + interval '23 hours'),
    (p, hoy - 61, 'Lo de hoy', 'No sé qué pasó. Estaba en la junta y de pronto no podía respirar. Salí al baño y me quedé ahí diez minutos. Nadie se dio cuenta, creo. Tengo miedo de que vuelva a pasar.', 'marcado_sesion', (hoy - 61)::timestamp + interval '23 hours 40 minutes'),
    (p, hoy - 47, null, 'Hoy hice el ejercicio que me dejaste. Al principio no quería. Después de unos minutos noté que sí me bajó la respiración. Tal vez sí funciona.', 'compartido', (hoy - 47)::timestamp + interval '21 hours'),
    (p, hoy - 33, 'Mi mamá', 'Fui al cumpleaños. No discutimos. Me fui antes de que se pusiera tenso y no me sentí culpable. Bueno, un poco. Pero menos.', 'compartido', (hoy - 33)::timestamp + interval '22 hours 30 minutes'),
    (p, hoy - 23, 'Sobre lo de Andrés', 'No sé si exageré. Me dolió que cancelara, pero más me dolió cómo lo dijo. Reaccioné con un mensaje horrible. Después lloré. Llamé a mi hermana como dice el plan. No quiero ser así pero algo se prende y no puedo parar.', 'marcado_sesion', (hoy - 23)::timestamp + interval '2 hours'),
    (p, hoy - 9, 'Carta', 'Escribí la carta a mi yo de hace un año. Le diría que no está sola, que va a aprender a decir que no, y que el cansancio no es flojera. Lloré, pero de alivio.', 'compartido', (hoy - 9)::timestamp + interval '20 hours'),
    (p, hoy - 2, 'Esto sí lo quiero hablar', 'Mi mamá volvió a decir que exagero con "eso de la terapia". Antes me hubiera callado. Esta vez le dije que era algo mío y cambié de tema. Me tembló la voz. Quiero hablar de cómo se sintió.', 'marcado_sesion', (hoy - 2)::timestamp + interval '21 hours 15 minutes');

  -- Sesiones semanales: 11 realizadas (jueves 17:00) y la próxima programada.
  for k in reverse 11..1 loop
    insert into public.sesiones (vinculacion_id, fecha_programada, fecha_realizada, duracion_min, modalidad, link_videollamada, estado, creado_at)
    values (vinc, ((hoy - (k * 7) - ((extract(dow from hoy)::int + 3) % 7)) + time '17:00')::timestamp at time zone 'America/Mexico_City',
            ((hoy - (k * 7) - ((extract(dow from hoy)::int + 3) % 7)) + time '17:02')::timestamp at time zone 'America/Mexico_City',
            50, (case when k % 3 = 0 then 'presencial' else 'online' end)::public.modalidad_sesion, 'https://meet.google.com/noema-demo', 'realizada',
            now() - make_interval(days => k * 7 + 3))
    returning id into ses;
    if k <= 5 then
      insert into public.sesion_notas (sesion_id, autor_id, contenido_publico, contenido_privado, objetivos_trabajados, plan_proxima_sesion, visible_paciente, creado_at)
      values (ses, t,
        case k
          when 5 then 'Revisamos la crisis de la junta. Identificaste el pensamiento "todos se dieron cuenta" y practicamos la respiración 4-7-8.'
          when 4 then 'Trabajamos límites en el trabajo. Ensayamos cómo decir que no al proyecto extra.'
          when 3 then 'Preparamos el cumpleaños de tu mamá: plan de salida, frase para cortar la discusión.'
          when 2 then 'Hablamos de la discusión con Andrés y de cómo usaste el plan de apoyo. Reconociste la señal de "algo se prende".'
          else 'Leímos juntas la carta a tu yo de hace un año. Nombraste el cansancio sin culpa.' end,
        case k
          when 5 then 'Patrón claro: hiperexigencia → ansiedad anticipatoria → cogniciones catastróficas. Empieza a reconocer el patrón. Explorar figura materna como origen.'
          when 4 then 'Buena respuesta a la exposición. Registrar pensamientos automáticos en el trabajo.'
          when 3 then 'Anticipación alta ante encuentro familiar. Sin ideación. Riesgo se mantiene en medio.'
          when 2 then 'Escalada emocional con pareja; conductas reparadoras adecuadas. Trabajar regulación en el momento.'
          else 'Avance sostenido. Considerar bajar nivel de riesgo a bajo en la siguiente revisión.' end,
        case k when 5 then array['Regulación', 'Reestructuración cognitiva'] when 4 then array['Asertividad'] when 3 then array['Relaciones familiares'] when 2 then array['Pareja', 'Regulación'] else array['Autocompasión'] end,
        case k when 5 then 'Introducir hoja de registro de pensamientos automáticos.' when 4 then 'Revisar registro de pensamientos; practicar límites.' when 3 then 'Evaluar cómo estuvo el cumpleaños.' when 2 then 'Retomar señales tempranas de escalada.' else 'Explorar lo marcado para sesión sobre su mamá.' end,
        true, now() - make_interval(days => k * 7 + 3) + interval '1 hour');
    end if;
  end loop;
  insert into public.sesiones (vinculacion_id, fecha_programada, duracion_min, modalidad, link_videollamada, estado)
  values (vinc, ((hoy + 2) + time '17:00')::timestamp at time zone 'America/Mexico_City', 50, 'online', 'https://meet.google.com/noema-demo', 'programada');

  -- Tareas con formatos, respuestas y retroalimentación.
  insert into public.tareas (vinculacion_id, asignada_por, titulo, descripcion, contenido_md, campos_respuesta, fecha_inicio, fecha_limite, frecuencia, estado, creado_at)
  values (vinc, t, 'Registro de pensamientos automáticos',
          'Cuando aparezca un pensamiento que te asuste en el trabajo, anótalo aquí con la situación que lo disparó.',
          'No tienes que responder en el momento. Puede ser al final del día. Lo importante es atrapar el pensamiento tal cual llegó.',
          '[{"key":"situacion","label":"¿Qué estaba pasando?","type":"text","required":true},{"key":"pensamiento","label":"¿Qué pensaste?","type":"text","required":true},{"key":"malestar","label":"Malestar (1 a 5)","type":"scale","min":1,"max":5},{"key":"alternativa","label":"Otra forma de verlo","type":"text"}]'::jsonb,
          hoy - 55, hoy - 40, 'unica', 'completada', now() - interval '55 days')
  returning id into tarea1;
  insert into public.tarea_respuestas (tarea_id, paciente_id, fecha, hora, respuestas, dificultad_percibida, compartir_terapeuta, retroalimentacion, retroalimentacion_por, retroalimentacion_at, creado_at) values
    (tarea1, p, hoy - 52, '20:30', '{"situacion":"Mi jefa me pidió el reporte para mañana","pensamiento":"Si no lo entrego perfecto me van a correr","malestar":5,"alternativa":"Puedo entregar una buena versión y ajustarla después"}'::jsonb, 4, true,
     'Fíjate cómo el pensamiento salta directo a la peor consecuencia. La alternativa que escribiste es muy buena.', t, now() - interval '51 days', now() - interval '52 days'),
    (tarea1, p, hoy - 45, '21:10', '{"situacion":"Junta de equipo, me pidieron opinión","pensamiento":"Todos se van a dar cuenta de que no sé","malestar":4,"alternativa":"Nadie sabe todo. Puedo decir lo que sí sé"}'::jsonb, 3, true,
     'Segunda vez que aparece "se van a dar cuenta". Lo vemos el jueves.', t, now() - interval '44 days', now() - interval '45 days');

  insert into public.tareas (vinculacion_id, asignada_por, titulo, descripcion, contenido_md, campos_respuesta, fecha_inicio, frecuencia, estado, creado_at)
  values (vinc, t, 'Respiración 4-7-8 antes de dormir',
          'Cinco minutos antes de acostarte. Inhala 4 segundos, sostén 7, exhala 8. Cuatro ciclos.',
          'Si te mareas, haz solo dos ciclos y descansa. No es una prueba: es una práctica.',
          '[{"key":"ciclos","label":"¿Cuántos ciclos hiciste?","type":"scale","min":1,"max":6},{"key":"nota","label":"¿Cómo te sentiste después?","type":"text"}]'::jsonb,
          hoy - 47, 'diaria', 'en_progreso', now() - interval '47 days')
  returning id into tarea2;
  for k in 1..7 loop
    insert into public.tarea_respuestas (tarea_id, paciente_id, fecha, hora, respuestas, dificultad_percibida, compartir_terapeuta, creado_at)
    values (tarea2, p, hoy - (44 - k * 6), '22:40', jsonb_build_object('ciclos', least(6, 1 + k), 'nota',
            case k when 1 then 'Me costó, no sabía si lo hacía bien.' when 2 then 'Hoy sí bajó un poco.' when 3 then 'Lo hice aunque no tenía ganas.'
                   when 4 then 'Ya casi ni cuento, me sale solo.' when 5 then 'Me dormí antes del cuarto ciclo.' when 6 then 'Lo usé en el trabajo, no solo de noche.' else 'Cuatro ciclos y a dormir.' end),
            greatest(1, 5 - k), true, now() - make_interval(days => 44 - k * 6));
  end loop;
  update public.tarea_respuestas set retroalimentacion = 'Justo eso: usarla de día es señal de que ya es tuya.', retroalimentacion_por = t, retroalimentacion_at = creado_at + interval '10 hours'
   where tarea_id = tarea2 and fecha = hoy - 8;

  insert into public.tareas (vinculacion_id, asignada_por, titulo, descripcion, campos_respuesta, fecha_inicio, fecha_limite, frecuencia, estado, creado_at)
  values (vinc, t, 'Carta a mi yo de hace un año', 'Escríbele a la Mariana de hace un año. ¿Qué le dirías hoy? No hay formato correcto.',
          '[{"key":"carta","label":"Tu carta","type":"text","required":true}]'::jsonb, hoy - 16, hoy - 9, 'unica', 'completada', now() - interval '16 days')
  returning id into tarea3;
  insert into public.tarea_respuestas (tarea_id, paciente_id, fecha, hora, respuestas, texto_libre, dificultad_percibida, compartir_terapeuta, retroalimentacion, retroalimentacion_por, retroalimentacion_at, creado_at)
  values (tarea3, p, hoy - 9, '20:05', '{"carta":"Querida Mariana: no estás sola aunque lo sientas. Vas a aprender a decir que no y no se va a caer nada. El cansancio no es flojera, es que llevas años cargando de más. Descansa. Te lo mereces."}'::jsonb,
          'La escribí de un tirón. Lloré, pero de alivio.', 2, true, 'Gracias por confiarme esto. La leemos juntas el jueves si quieres.', t, now() - interval '8 days', now() - interval '9 days');

  insert into public.tareas (vinculacion_id, asignada_por, titulo, descripcion, campos_respuesta, fecha_inicio, fecha_limite, frecuencia, estado, creado_at)
  values (vinc, t, 'Pedir ayuda una vez esta semana', 'Elige una tarea del trabajo y pide apoyo a alguien del equipo. Anota qué pasó y cómo te sentiste.',
          '[{"key":"que","label":"¿Qué pediste y a quién?","type":"text","required":true},{"key":"malestar","label":"Malestar antes de pedirlo (1 a 5)","type":"scale","min":1,"max":5},{"key":"despues","label":"¿Y después?","type":"text"}]'::jsonb,
          hoy - 3, hoy + 4, 'unica', 'pendiente', now() - interval '3 days')
  returning id into tarea4;

  -- Mensajes.
  insert into public.mensajes (vinculacion_id, autor_id, contenido, creado_at, leido_at) values
    (vinc, t, 'Mariana, te dejé asignada la respiración 4-7-8. Cuando la pruebes, cuéntame cómo te fue.', now() - interval '47 days', now() - interval '47 days' + interval '40 minutes'),
    (vinc, p, 'Gracias. La hice anoche cuando empecé a sentirme ansiosa. Ayudó más de lo que esperaba.', now() - interval '46 days', now() - interval '46 days' + interval '1 hour'),
    (vinc, t, 'Qué bueno. Recuerda que cualquier emoción es información, no hay que combatirla.', now() - interval '46 days' + interval '2 hours', now() - interval '46 days' + interval '3 hours'),
    (vinc, p, 'Le dije que no a mi jefa. Temblé pero lo dije. Lo registré por si lo quieres ver.', now() - interval '44 days', now() - interval '44 days' + interval '20 minutes'),
    (vinc, t, 'Lo vi. Eso es exactamente lo que ensayamos. Estoy orgullosa de ti.', now() - interval '44 days' + interval '1 hour', now() - interval '44 days' + interval '2 hours'),
    (vinc, p, 'Anoche usé el plan de apoyo. Llamé a mi hermana. Ya estoy mejor, pero fue fuerte.', now() - interval '23 days' + interval '8 hours', now() - interval '23 days' + interval '9 hours'),
    (vinc, t, 'Gracias por avisarme. Hiciste lo que acordamos y eso importa. ¿Quieres que adelantemos la sesión?', now() - interval '23 days' + interval '9 hours', now() - interval '23 days' + interval '10 hours'),
    (vinc, p, 'No hace falta, puedo esperar al jueves. Lo dejé marcado para sesión en el diario.', now() - interval '23 days' + interval '10 hours', now() - interval '23 days' + interval '11 hours'),
    (vinc, t, 'Perfecto. Ahí lo vemos con calma.', now() - interval '23 days' + interval '11 hours', now() - interval '23 days' + interval '12 hours'),
    (vinc, p, 'Terminé la carta. No sabía que tenía tanto guardado.', now() - interval '9 days', now() - interval '9 days' + interval '3 hours'),
    (vinc, t, 'Gracias por confiármela. La leemos juntas si quieres.', now() - interval '9 days' + interval '3 hours', now() - interval '9 days' + interval '5 hours'),
    (vinc, p, 'Hoy no fue un buen día con mi mamá. No pasó nada grave, pero quiero hablarlo el jueves. Lo dejé en el diario.', now() - interval '2 days' + interval '21 hours', null);

  -- Plan de apoyo.
  insert into public.plan_apoyo (vinculacion_id, contacto_nombre, contacto_relacion, contacto_telefono, plan_seguridad, notificar_uso)
  values (vinc, 'Andrea Soto', 'Hermana', '55 8765 4321',
          E'1. Reconozco la señal: "algo se prende" y la respiración se acorta.\n2. Salgo del lugar o cuelgo. No respondo mensajes en ese momento.\n3. Cuatro ciclos de respiración 4-7-8.\n4. Llamo a Andrea o le escribo a Valeria.\n5. Si no baja en 30 minutos, marco a la Línea de la Vida.', true)
  on conflict (vinculacion_id) do nothing;
  insert into public.plan_apoyo_recursos (vinculacion_id, tipo, titulo, url, nota) values
    (vinc, 'respiracion', 'Respiración 4-7-8', null, 'Inhala 4, sostén 7, exhala 8. Cuatro ciclos.'),
    (vinc, 'audio', 'Audio de relajación guiada (8 min)', 'https://app.somosnoema.com/demo/recursos/relajacion', 'El que escuchamos en sesión.'),
    (vinc, 'recordatorio', 'Lo que me dijo Valeria', null, 'Estar nerviosa no significa estar en peligro.');
  insert into public.plan_apoyo_usos (vinculacion_id, paciente_id, usado_at, retroalimentacion, retro_at)
  values (vinc, p, now() - interval '23 days' + interval '1 hour 40 minutes', 'Ya estoy mejor. Hablé con mi hermana y respiré.', now() - interval '23 days' + interval '2 hours');

  -- Metas.
  insert into public.recordatorios_personales (paciente_id, titulo, nota, recurrencia, tipo, compartida, completado, completado_at, creado_at) values
    (p, 'Caminar 20 minutos', 'Sin audífonos, solo caminar.', 'diaria', 'diario', true, true, now() - interval '3 hours', now() - interval '40 days'),
    (p, 'Dormir antes de las 11', null, 'diaria', 'diario', false, false, null, now() - interval '30 days'),
    (p, 'Hablar con mi jefa sobre la carga', 'Ya lo hice. Sobreviví.', 'unica', 'corto', true, true, now() - interval '44 days', now() - interval '50 days'),
    (p, 'Retomar la natación', 'Martes y jueves temprano.', 'semanal', 'mediano', true, false, null, now() - interval '20 days'),
    (p, 'Ir a ver a mi mamá sin sentirme culpable', null, 'unica', 'largo', false, false, null, now() - interval '60 days');

  -- Expediente (NOM-004) y notas privadas.
  insert into public.expediente_inicial (vinculacion_id, motivo_consulta, padecimiento_actual, antecedentes_familiares, antecedentes_personales, examen_mental, impresion_diagnostica, plan_terapeutico, pronostico, elaborado_por, fecha_elaboracion)
  values (vinc, 'Ansiedad ante el trabajo y sensación constante de no dar el ancho. Dificultad para poner límites.',
          'Tres meses con insomnio de conciliación, tensión muscular y episodios de sobrecarga. Un episodio de crisis de ansiedad en contexto laboral.',
          'Madre con rasgos exigentes y críticos. Sin antecedentes psiquiátricos conocidos.',
          'Sin tratamientos previos. Sin consumo de sustancias. Buen soporte social (hermana, pareja).',
          'Orientada, cooperadora, discurso coherente. Afecto ansioso. Sin alteraciones sensoperceptivas. Sin ideación suicida.',
          'Impresión de trabajo (no diagnóstico): patrón de hiperexigencia con ansiedad anticipatoria. A confirmar en el proceso.',
          'Terapia cognitivo-conductual semanal. Psicoeducación, registro de pensamientos, regulación fisiológica, asertividad y trabajo con figura materna.',
          'Favorable. Buena adherencia y capacidad de insight.', t, hoy - 86)
  on conflict (vinculacion_id) do nothing;
  insert into public.notas_privadas (vinculacion_id, terapeuta_id, titulo, contenido, creado_at) values
    (vinc, t, 'Hipótesis de trabajo', 'La exigencia parece heredada de la relación con la madre. Explorar con cuidado; no forzar antes de que ella lo nombre.', now() - interval '80 days'),
    (vinc, t, 'Señales de avance', 'Pone límites, usa el plan de apoyo y tolera el malestar sin escalar. Evaluar bajar riesgo a "bajo".', now() - interval '6 days');

  -- Consentimiento informado firmado e informe compartido.
  insert into public.consentimientos_informados (vinculacion_id, titulo, contenido, creado_por, enviado_at, firmado_at, firma_nombre)
  values (vinc, 'Consentimiento informado para psicoterapia',
          'Acepto participar en un proceso psicoterapéutico con enfoque cognitivo-conductual. Entiendo que puedo detenerlo en cualquier momento y que lo que comparta es confidencial, salvo riesgo para mi vida o la de otros.',
          t, now() - interval '87 days', now() - interval '86 days', 'Mariana Soto');
  insert into public.informes_paciente (vinculacion_id, titulo, contenido, creado_por, compartido_at, visto_at)
  values (vinc, 'Avance del primer mes',
          E'En el primer mes registraste tus emociones 31 veces y compartiste 24. La ansiedad ligada al trabajo apareció en 14 de ellas.\n\nPusiste en práctica la respiración 4-7-8 y registraste pensamientos automáticos. Lograste decir que no a un proyecto extra.\n\nSiguiente etapa: límites con tu familia y reconocer las señales tempranas de sobrecarga.',
          t, now() - interval '58 days', now() - interval '57 days');

  -- Resumen pre-sesión guardado (historial de IA).
  insert into public.resumenes_sesion (vinculacion_id, terapeuta_id, datos, narrativa, dias, generado_at)
  values (vinc, t, jsonb_build_object(
      'ok', true, 'nombre', 'Mariana Soto', 'dias', 14,
      'metricas', jsonb_build_object('registros', 17, 'marcados', 2, 'intensidadProm', 2.9, 'deltaIntensidad', -0.6, 'adherenciaPct', 86, 'tareasCompletadas', 2, 'tareasTotal', 3, 'diario', 2),
      'serie', '[]'::jsonb,
      'distribucion', jsonb_build_array(jsonb_build_object('label','Tranquilo','valor',8,'color','#C7D2BD'), jsonb_build_object('label','Ansioso','valor',5,'color','#F0C9AE'), jsonb_build_object('label','Feliz','valor',4,'color','#B9C9CC')),
      'marcadosSesion', '[]'::jsonb, 'diarioSesion', '[]'::jsonb, 'tareas', '[]'::jsonb, 'planPrevio', 'Retomar señales tempranas de escalada.',
      'narrativa', 'En estas dos semanas Mariana registró 17 veces, con intensidad promedio a la baja. Marcó para sesión la discusión con su pareja y el uso del plan de apoyo. Completó la carta y mantiene la respiración diaria.'),
    'En estas dos semanas Mariana registró 17 veces, con intensidad promedio a la baja. Marcó para sesión la discusión con su pareja y el uso del plan de apoyo. Completó la carta y mantiene la respiración diaria.',
    14, now() - interval '7 days');

  -- Mensaje de acompañamiento de hoy (para no llamar al modelo en el demo).
  insert into public.mensajes_noema (paciente_id, texto, basado_en, modelo, origen, generado_at)
  values (p, 'Esta semana registraste calma cinco veces y ansiedad dos. Ayer escribiste que no te llevaste el mal día a la cama. Hoy, una cosa pequeña: antes de abrir el correo, dos ciclos de respiración.',
          '{"registros": 7, "diario": 1}'::jsonb, 'demo', 'ia', now() - interval '2 hours');

  -- Pagos y finanzas de la consulta.
  for k in 0..11 loop
    insert into public.pagos_pacientes (terapeuta_id, vinculacion_id, monto, concepto, metodo, estado, fecha)
    values (t, vinc, 850, 'Sesión semanal', (case when k % 2 = 0 then 'transferencia' else 'tarjeta' end)::public.metodo_pago, 'pagado', hoy - (k * 7 + 1));
  end loop;
  insert into public.finanzas_movimientos (terapeuta_id, tipo, categoria, concepto, monto, fecha, recurrente) values
    (t, 'gasto_fijo', 'Consultorio', 'Renta del consultorio', 6500, hoy - 1, true),
    (t, 'gasto_fijo', 'Consultorio', 'Renta del consultorio', 6500, hoy - 31, true),
    (t, 'gasto_fijo', 'Consultorio', 'Renta del consultorio', 6500, hoy - 61, true),
    (t, 'gasto_variable', 'Formación', 'Curso de intervención en crisis', 2400, hoy - 20, false),
    (t, 'gasto_variable', 'Materiales', 'Impresión de formatos', 380, hoy - 12, false),
    (t, 'ingreso_otro', 'Taller', 'Taller de manejo de ansiedad (empresa)', 4800, hoy - 15, false);
  insert into public.finanzas_activos (terapeuta_id, nombre, categoria, valor, fecha_adquisicion) values
    (t, 'Laptop de consulta', 'Equipo', 24000, hoy - 400), (t, 'Sillón y mobiliario', 'Consultorio', 18500, hoy - 700);

  -- ── Pacientes de relleno (para que el panel se vea vivo) ───────────────────
  for k in 1..3 loop
    extra_p := gen_random_uuid();
    perform public.demo_insertar_usuario(extra_p, 'paciente' || k || '+' || replace(p_visitante::text, '-', '') || '@demo.noema.app',
                                         gen_random_uuid()::text, nombres[k], 'paciente', p_visitante);
    insert into public.pacientes (profile_id, fecha_nacimiento, ocupacion, motivos_consulta)
    values (extra_p, hoy - make_interval(years => 26 + k * 6), ocup[k], motivos[k:k][1:2]) on conflict (profile_id) do nothing;
    insert into public.vinculaciones (terapeuta_id, paciente_id, codigo_invitacion, nombre_invitado, estado, fecha_inicio,
                                      consentimiento_aceptado_at, version_consentimiento, nivel_riesgo, nivel_riesgo_nota)
    values (t, extra_p, 'DEMO-' || upper(left(md5(p_visitante::text || k), 4)), nombres[k], 'activa', now() - make_interval(days => 30 + k * 25),
            now() - make_interval(days => 30 + k * 25), '2026-05-v1', riesgos[k],
            case k when 3 then 'Duelo reciente por la madre. Ideación pasiva descartada en última sesión; seguimiento cercano.' else null end)
    returning id into extra_v;
    update public.demo_visitantes set usuarios = array_append(usuarios, extra_p) where id = p_visitante;

    for d in reverse 20..0 loop
      if (d * (k + 3)) % 3 = 0 then
        r := (d * 31 + k * 17) % 100;
        clave := case k when 1 then (case when r < 40 then 'cansado' when r < 65 then 'preocupado' else 'tranquilo' end)
                        when 2 then (case when r < 30 then 'inquieto' when r < 60 then 'satisfecho' else 'tranquilo' end)
                        else (case when r < 45 then 'triste' when r < 70 then 'en_duelo' when r < 85 then 'cansado' else 'tranquilo' end) end;
        h := make_time(9 + (r % 11), (r * 3) % 60, 0);
        ts_mx := ((hoy - d) + h)::timestamp at time zone 'America/Mexico_City';
        insert into public.registros_emocionales (paciente_id, fecha, hora, registrado_at, emocion_principal_key, intensidad, privacidad, creado_at)
        values (extra_p, hoy - d, h, ts_mx, clave, 2 + (r % 3) + (case when k = 3 then 1 else 0 end), (case when r % 8 = 0 then 'privado' else 'compartido' end)::public.nivel_privacidad, ts_mx);
      end if;
    end loop;

    insert into public.sesiones (vinculacion_id, fecha_programada, duracion_min, modalidad, estado)
    values (extra_v, ((hoy + k) + make_time(9 + k * 2, 0, 0))::timestamp at time zone 'America/Mexico_City', 50,
            (case when k = 2 then 'presencial' else 'online' end)::public.modalidad_sesion, 'programada');
    insert into public.sesiones (vinculacion_id, fecha_programada, fecha_realizada, duracion_min, modalidad, estado)
    values (extra_v, ((hoy - 7 + k) + make_time(9 + k * 2, 0, 0))::timestamp at time zone 'America/Mexico_City',
            ((hoy - 7 + k) + make_time(9 + k * 2, 2, 0))::timestamp at time zone 'America/Mexico_City', 50, 'online', 'realizada');
    insert into public.tareas (vinculacion_id, asignada_por, titulo, descripcion, fecha_inicio, fecha_limite, frecuencia, estado)
    values (extra_v, t, case k when 1 then 'Higiene del sueño: apagar pantallas a las 10' when 2 then 'Lista de logros de la semana' else 'Carta de despedida' end,
            'Tarea asignada en la última sesión.', hoy - 2, hoy + 5, 'unica', 'pendiente');
    for i in 0..3 loop
      insert into public.pagos_pacientes (terapeuta_id, vinculacion_id, monto, concepto, metodo, estado, fecha)
      values (t, extra_v, 850, 'Sesión', 'transferencia', (case when i = 0 and k = 3 then 'pendiente' else 'pagado' end)::public.estado_pago, hoy - (i * 7 + k));
    end loop;
  end loop;

  -- ── Notificaciones curadas (las automáticas del sembrado se descartan) ─────
  delete from public.notificaciones where destinatario_id in (t, p);
  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, url, vinculacion_id, leida_at, creada_at, push_enviada) values
    (t, 'mensaje', 'Mensaje de Mariana Soto', 'Hoy no fue un buen día con mi mamá. No pasó nada grave, pero quiero hablarlo el jueves.', '/mensajes/' || vinc, vinc, null, now() - interval '2 days' + interval '21 hours', true),
    (t, 'diario', 'Mariana marcó una entrada para sesión', 'Esto sí lo quiero hablar', '/pacientes/' || vinc || '/diario', vinc, null, now() - interval '2 days' + interval '21 hours 15 minutes', true),
    (t, 'registro', 'Registro compartido de Mariana Soto', 'Tranquila · Lista para la sesión del jueves.', '/pacientes/' || vinc || '/registros', vinc, null, now() - interval '3 hours', true),
    (t, 'tarea_completada', 'Mariana completó "Carta a mi yo de hace un año"', null, '/pacientes/' || vinc || '/ejercicios', vinc, now() - interval '8 days', now() - interval '9 days', true),
    (t, 'plan_apoyo', 'Mariana usó su plan de apoyo', 'Llamó a su contacto de confianza. Ya está mejor.', '/pacientes/' || vinc || '/plan-apoyo', vinc, now() - interval '22 days', now() - interval '23 days' + interval '1 hour 40 minutes', true),
    (p, 'tarea', 'Nueva tarea: Pedir ayuda una vez esta semana', 'Tu psicóloga te dejó una tarea.', '/paciente/tareas', vinc, null, now() - interval '3 days', true),
    (p, 'retroalimentacion', 'Valeria comentó tu respiración', 'Justo eso: usarla de día es señal de que ya es tuya.', '/paciente/tareas', vinc, now() - interval '7 days', now() - interval '8 days', true),
    (p, 'mensaje', 'Mensaje de tu psicóloga', 'Gracias por confiármela. La leemos juntas si quieres.', '/paciente/mensajes', vinc, now() - interval '8 days', now() - interval '9 days' + interval '3 hours', true);

  if tiene_push_expo then execute 'alter table public.notificaciones enable trigger trg_push_notificacion'; end if;
  if tiene_push_web then execute 'alter table public.notificaciones enable trigger trg_push_web_al_instante'; end if;
end;
$fn$;

-- =============================================================================
-- Crear un visitante: pareja de cuentas + historia. Devuelve los correos.
-- =============================================================================
create or replace function public.demo_crear_visitante(p_visitante uuid, p_password text, p_ip_hash text default null)
returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  t uuid := gen_random_uuid();
  p uuid := gen_random_uuid();
  sufijo text := replace(p_visitante::text, '-', '');
  email_t text := 'psicologa+' || sufijo || '@demo.noema.app';
  email_p text := 'paciente+' || sufijo || '@demo.noema.app';
  recientes int;
begin
  if exists (select 1 from public.demo_visitantes where id = p_visitante) then
    return public.demo_estado(p_visitante);
  end if;
  -- Freno de abuso: máximo 200 visitantes nuevos por hora.
  select count(*) into recientes from public.demo_visitantes where creado_at > now() - interval '1 hour';
  if recientes >= 200 then
    return jsonb_build_object('ok', false, 'error', 'demo_ocupado');
  end if;

  insert into public.demo_visitantes (id, terapeuta_id, paciente_id, usuarios, ip_hash)
  values (p_visitante, t, p, array[t, p], p_ip_hash);

  perform public.demo_insertar_usuario(t, email_t, p_password, 'Valeria Ortiz', 'terapeuta', p_visitante);
  perform public.demo_insertar_usuario(p, email_p, p_password, 'Mariana Soto', 'paciente', p_visitante);
  perform public.demo_sembrar_contenido(p_visitante);

  return public.demo_estado(p_visitante);
end;
$fn$;

-- =============================================================================
-- Estado de un visitante (correos, ids, vinculación) para el servidor.
-- =============================================================================
create or replace function public.demo_estado(p_visitante uuid) returns jsonb
language sql security definer set search_path = public stable as $fn$
  select case when v.id is null then jsonb_build_object('ok', false, 'error', 'no_existe')
         else jsonb_build_object(
           'ok', true,
           'visitante', v.id,
           'terapeuta_id', v.terapeuta_id,
           'paciente_id', v.paciente_id,
           'vinculacion_id', v.vinculacion_id,
           'email_psicologo', (select email from public.profiles where id = v.terapeuta_id),
           'email_paciente', (select email from public.profiles where id = v.paciente_id),
           'creado_at', v.creado_at,
           'reiniciado_at', v.reiniciado_at) end
  from (select * from public.demo_visitantes where id = p_visitante union all select null, null, null, null, null, null, null, null limit 1) v;
$fn$;

-- =============================================================================
-- Reiniciar: borrar la historia del visitante y volverla a sembrar.
-- =============================================================================
create or replace function public.demo_reiniciar(p_visitante uuid) returns jsonb
language plpgsql security definer set search_path = public as $fn$
begin
  if not exists (select 1 from public.demo_visitantes where id = p_visitante) then
    return jsonb_build_object('ok', false, 'error', 'no_existe');
  end if;
  perform public.demo_borrar_contenido(p_visitante);
  perform public.demo_sembrar_contenido(p_visitante);
  update public.demo_visitantes set reiniciado_at = now() where id = p_visitante;
  return public.demo_estado(p_visitante);
end;
$fn$;

-- =============================================================================
-- Limpieza: borra a los visitantes con más de p_horas de antigüedad (0 = todos).
-- =============================================================================
create or replace function public.demo_limpiar(p_horas int default 0) returns int
language plpgsql security definer set search_path = public as $fn$
declare
  v record; u uuid; n int := 0;
begin
  perform set_config('noema.bypass_proteccion', '1', true);
  for v in select * from public.demo_visitantes where creado_at < now() - make_interval(hours => p_horas) loop
    foreach u in array v.usuarios loop
      delete from auth.users where id = u;
    end loop;
    delete from public.demo_visitantes where id = v.id;
    n := n + 1;
  end loop;
  -- Cuentas demo huérfanas (por si acaso).
  delete from auth.users where id in (select id from public.profiles where demo_visitante is not null and demo_visitante not in (select id from public.demo_visitantes));
  return n;
end;
$fn$;

-- ── Permisos: solo el servidor ───────────────────────────────────────────────
revoke all on function public.demo_insertar_usuario(uuid, text, text, text, public.rol_usuario, uuid) from public, anon, authenticated;
revoke all on function public.demo_borrar_contenido(uuid) from public, anon, authenticated;
revoke all on function public.demo_sembrar_contenido(uuid) from public, anon, authenticated;
revoke all on function public.demo_crear_visitante(uuid, text, text) from public, anon, authenticated;
revoke all on function public.demo_estado(uuid) from public, anon, authenticated;
revoke all on function public.demo_reiniciar(uuid) from public, anon, authenticated;
revoke all on function public.demo_limpiar(int) from public, anon, authenticated;
grant execute on function public.demo_crear_visitante(uuid, text, text) to service_role;
grant execute on function public.demo_estado(uuid) to service_role;
grant execute on function public.demo_reiniciar(uuid) to service_role;
grant execute on function public.demo_limpiar(int) to service_role;

-- ── Reinicio nocturno: 03:00 CDMX (09:00 UTC) borra a todos los visitantes ───
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('demo_reinicio_nocturno')
    where exists (select 1 from cron.job where jobname = 'demo_reinicio_nocturno');
  perform cron.schedule('demo_reinicio_nocturno', '0 9 * * *', $cron$ select public.demo_limpiar(0); $cron$);
exception when others then
  raise notice 'pg_cron no disponible: %', sqlerrm;
end $$;
