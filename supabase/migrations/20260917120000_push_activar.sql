-- =============================================================================
-- NOEMA · Activar notificaciones push (Expo) de punta a punta
-- =============================================================================
-- Qué corrige respecto a 20260908140000_push_notificaciones.sql:
--
--   1. Habilita la extensión pg_net. Sin ella `net.http_post` no existe y el
--      trigger de push hacía fallar TODA inserción en `notificaciones` (la
--      campana web, los recordatorios, etc.).
--   2. El trigger ya no puede romper la inserción: si pg_net no está o la
--      llamada falla, deja un `warning` y la notificación se guarda igual.
--   3. Respeta las preferencias que ya existen en Ajustes:
--        - terapeuta: notif_mensajes / notif_registros / notif_tareas
--          (crisis y vinculación siempre) y "no molestar" (llega sin sonido).
--        - paciente: notif_paciente en su vinculación.
--   4. Un solo envío por notificación con todos los dispositivos del
--      destinatario (Expo acepta hasta 100 mensajes por petición).
--   5. Guarda a qué tokens fue cada envío (`push_envios`) para borrar los que
--      Expo reporta como `DeviceNotRegistered` (job horario con pg_cron).
--
-- Opcional: token de acceso de Expo (recomendado en producción; evita que
-- terceros envíen push con tus tokens):
--   alter database postgres set app.settings.expo_access_token = 'expo_xxx';
--
-- Idempotente.
-- =============================================================================

-- ── 1. pg_net ────────────────────────────────────────────────────────────────
-- En Supabase (cloud y self-hosted con la imagen supabase/postgres) la
-- extensión ya viene precargada; solo hay que crearla.
do $$
begin
  begin
    create extension if not exists pg_net with schema extensions;
  exception when others then
    -- Algunas versiones no permiten elegir schema.
    create extension if not exists pg_net;
  end;
exception when others then
  raise notice 'pg_net no disponible (%). Las notificaciones se guardarán pero no se enviarán como push.', sqlerrm;
end $$;

-- ── 2. Registro de envíos (para limpiar tokens muertos) ──────────────────────
create table if not exists public.push_envios (
  request_id bigint primary key,      -- id que devuelve net.http_post
  tokens     text[] not null,         -- tokens en el mismo orden que los mensajes
  creado_at  timestamptz not null default now()
);

comment on table public.push_envios is
  'Envíos push pendientes de revisar. Solo lo usa la limpieza de tokens; sin acceso desde clientes.';

-- RLS sin políticas: solo las funciones security definer lo tocan.
alter table public.push_envios enable row level security;

create index if not exists push_envios_creado_idx on public.push_envios (creado_at);

-- ── 2b. Registro del token desde la app ──────────────────────────────────────
-- Un teléfono puede cambiar de cuenta. Con el upsert directo, la RLS impedía
-- reasignar un token que ya era de otro usuario, y ese dispositivo seguía
-- recibiendo los avisos de la cuenta anterior. Esta RPC lo reasigna siempre al
-- usuario autenticado.
create or replace function public.registrar_push_token(p_token text, p_plataforma text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autenticado' using errcode = '42501';
  end if;
  if coalesce(p_token, '') = '' then
    return;
  end if;

  insert into public.push_tokens (user_id, token, plataforma, actualizado_at)
  values (auth.uid(), p_token, p_plataforma, now())
  on conflict (token) do update
    set user_id        = excluded.user_id,
        plataforma     = excluded.plataforma,
        actualizado_at = now();
end $$;

revoke all on function public.registrar_push_token(text, text) from public;
grant execute on function public.registrar_push_token(text, text) to authenticated;

-- ── 3. Trigger de envío ───────────────────────────────────────────────────────
create or replace function public.enviar_push_notificacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_terapeuta   uuid;
  v_paciente    uuid;
  v_notif_pac   boolean := true;
  v_cfg         record;
  v_silencio    boolean := false;   -- "no molestar" del terapeuta
  v_ahora       time;
  v_tokens      text[];
  v_mensajes    jsonb;
  v_headers     jsonb;
  v_expo_token  text;
  v_request_id  bigint;
begin
  -- Sin pg_net no hay push; la notificación ya quedó guardada para la campana.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'net' and p.proname = 'http_post'
  ) then
    return new;
  end if;

  -- ¿Quién es el destinatario dentro de la vinculación?
  if new.vinculacion_id is not null then
    select terapeuta_id, paciente_id, coalesce(notif_paciente, true)
      into v_terapeuta, v_paciente, v_notif_pac
    from public.vinculaciones where id = new.vinculacion_id;
  end if;

  -- Preferencias del paciente (Ajustes del terapeuta → "Notificaciones al paciente").
  if v_paciente is not null and new.destinatario_id = v_paciente and not v_notif_pac then
    return new;
  end if;

  -- Preferencias del terapeuta (Ajustes → "Mis notificaciones").
  if new.destinatario_id = v_terapeuta or new.vinculacion_id is null then
    select notif_mensajes, notif_registros, notif_tareas,
           no_molestar_activo, no_molestar_desde, no_molestar_hasta
      into v_cfg
    from public.configuracion_terapeuta
    where terapeuta_id = new.destinatario_id;

    if found then
      if (new.tipo = 'mensaje'          and not v_cfg.notif_mensajes)
      or (new.tipo = 'registro'         and not v_cfg.notif_registros)
      or (new.tipo = 'tarea_completada' and not v_cfg.notif_tareas) then
        return new;
      end if;

      -- No molestar: la notificación llega, pero sin sonido (igual que en la web).
      -- Las alertas de crisis siempre suenan.
      if v_cfg.no_molestar_activo and new.tipo <> 'crisis' then
        v_ahora := localtime;  -- la BD opera en America/Mexico_City (00033)
        if v_cfg.no_molestar_desde <= v_cfg.no_molestar_hasta then
          v_silencio := v_ahora >= v_cfg.no_molestar_desde and v_ahora < v_cfg.no_molestar_hasta;
        else
          v_silencio := v_ahora >= v_cfg.no_molestar_desde or v_ahora < v_cfg.no_molestar_hasta;
        end if;
      end if;
    end if;
  end if;

  -- Dispositivos del destinatario.
  select array_agg(token order by actualizado_at desc)
    into v_tokens
  from public.push_tokens
  where user_id = new.destinatario_id;

  if v_tokens is null or array_length(v_tokens, 1) = 0 then
    return new;
  end if;

  -- Un mensaje por dispositivo (misma petición).
  select jsonb_agg(
           jsonb_strip_nulls(jsonb_build_object(
             'to',        t,
             'title',     new.titulo,
             'body',      new.cuerpo,
             'sound',     case when v_silencio then null else 'default' end,
             'priority',  case when new.tipo = 'crisis' then 'high'
                               when v_silencio then 'normal'
                               else 'default' end,
             'channelId', case when new.tipo = 'crisis' then 'crisis' else 'avisos' end,
             'data',      jsonb_build_object(
                            'notificacion_id', new.id,
                            'tipo',            new.tipo,
                            'url',             new.url,
                            'vinculacion_id',  new.vinculacion_id
                          )
           ))
         )
    into v_mensajes
  from unnest(v_tokens) as t;

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Accept',       'application/json'
  );
  v_expo_token := nullif(current_setting('app.settings.expo_access_token', true), '');
  if v_expo_token is not null then
    v_headers := v_headers || jsonb_build_object('Authorization', 'Bearer ' || v_expo_token);
  end if;

  -- Nunca romper la inserción por un problema de red/extension.
  begin
    select net.http_post(
      url     := 'https://exp.host/--/api/v2/push/send',
      headers := v_headers,
      body    := v_mensajes
    ) into v_request_id;

    if v_request_id is not null then
      insert into public.push_envios (request_id, tokens)
      values (v_request_id, v_tokens)
      on conflict (request_id) do nothing;
    end if;
  exception when others then
    raise warning 'push no enviado para notificacion %: %', new.id, sqlerrm;
  end;

  return new;
end $$;

drop trigger if exists trg_push_notificacion on public.notificaciones;
create trigger trg_push_notificacion
  after insert on public.notificaciones
  for each row execute function public.enviar_push_notificacion();

-- ── 4. Limpieza de tokens que Expo reporta como muertos ──────────────────────
-- pg_net guarda las respuestas en net._http_response (las conserva ~6 h).
-- Expo responde `data[i]` en el mismo orden que los mensajes enviados; si un
-- ticket trae `DeviceNotRegistered`, ese token ya no sirve y se borra.
create or replace function public.limpiar_push_tokens_invalidos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  e          record;
  v_body     jsonb;
  v_n        integer;
  v_borrados integer := 0;
begin
  if to_regclass('net._http_response') is null then
    return 0;
  end if;

  for e in
    select pe.request_id, pe.tokens, r.content, r.status_code
    from public.push_envios pe
    join net._http_response r on r.id = pe.request_id
  loop
    -- Solo respuestas JSON válidas; el resto se descarta.
    begin
      v_body := e.content::jsonb;
    exception when others then
      v_body := null;
    end;

    if v_body is not null
       and e.status_code between 200 and 299
       and jsonb_typeof(v_body -> 'data') = 'array' then
      with tickets as (
        select d.value as ticket, d.ordinality as pos
        from jsonb_array_elements(v_body -> 'data') with ordinality as d
      )
      delete from public.push_tokens pt
      using tickets
      where pt.token = e.tokens[tickets.pos]
        and tickets.ticket -> 'details' ->> 'error' = 'DeviceNotRegistered';
      get diagnostics v_n = row_count;
      v_borrados := v_borrados + v_n;
    end if;

    -- Ya revisado.
    delete from public.push_envios where request_id = e.request_id;
  end loop;

  -- Envíos cuya respuesta ya no existe (pg_net la purgó): olvidarlos.
  delete from public.push_envios where creado_at < now() - interval '1 day';

  return v_borrados;
end $$;

-- Cada hora. Si pg_cron no está, se puede llamar a mano.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('limpiar_push_tokens_horario')
    where exists (select 1 from cron.job where jobname = 'limpiar_push_tokens_horario');
  perform cron.schedule(
    'limpiar_push_tokens_horario',
    '17 * * * *',
    $cron$ select public.limpiar_push_tokens_invalidos(); $cron$
  );
exception when others then
  raise notice 'pg_cron no disponible o sin permisos: %', sqlerrm;
end $$;
