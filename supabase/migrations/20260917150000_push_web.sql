-- =============================================================================
-- NOEMA · Avisos push WEB (web-push / VAPID) para el panel instalado como PWA
-- =============================================================================
-- Convive con los push de Expo (20260908140000 + 20260917120000): misma tabla
-- `notificaciones`, dos triggers distintos (trg_push_notificacion = Expo,
-- trg_push_web_al_instante = web). No toca nada de Expo.
--
-- Piezas:
--   1. push_suscripciones: una fila por navegador (endpoint = PK) y usuario.
--   2. registrar_push_suscripcion(): upsert que SIEMPRE reasigna al auth.uid().
--   3. notificaciones.push_enviada: lo existente se marca como enviado (historia).
--   4. push_pendientes() / marcar_push_enviada(): solo service_role; las usa
--      /api/push/despachar. Respeta las mismas preferencias que Expo.
--   5. push_web_al_instante(): trigger con pg_net que avisa al despachador.
--   6. Cron diario de respaldo (pg_cron).
--
-- ATENCION: en el VPS hay que sustituir los placeholders <DOMINIO> y
--   <CRON_SECRET> de las secciones 5 y 6 por los valores reales (no van en el
--   repo). Ver infra/panel/docker-compose.yml.
--
-- Idempotente.
-- =============================================================================

-- ── 1. Suscripciones ─────────────────────────────────────────────────────────
create table if not exists public.push_suscripciones (
  endpoint       text primary key,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  p256dh         text not null,
  auth           text not null,
  user_agent     text,
  creado_at      timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

comment on table public.push_suscripciones is
  'Suscripciones push web (PushManager). Un navegador pertenece a UN usuario a la vez.';

create index if not exists push_suscripciones_user_idx on public.push_suscripciones (user_id);

alter table public.push_suscripciones enable row level security;

drop policy if exists push_suscripciones_propias on public.push_suscripciones;
create policy push_suscripciones_propias on public.push_suscripciones
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 2. Registro desde el navegador (reasigna dueño) ──────────────────────────
-- Con el upsert directo, la RLS impide reasignar un endpoint que ya era de
-- otro usuario y ese navegador seguiría recibiendo los avisos de la cuenta
-- anterior. Esta RPC lo reasigna siempre al usuario autenticado (mismo truco
-- que registrar_push_token).
create or replace function public.registrar_push_suscripcion(
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no autenticado' using errcode = '42501';
  end if;
  if coalesce(p_endpoint, '') = '' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'suscripcion incompleta' using errcode = '22023';
  end if;

  insert into public.push_suscripciones (endpoint, user_id, p256dh, auth, user_agent, actualizado_at)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth, left(p_user_agent, 300), now())
  on conflict (endpoint) do update
    set user_id        = excluded.user_id,
        p256dh         = excluded.p256dh,
        auth           = excluded.auth,
        user_agent     = excluded.user_agent,
        actualizado_at = now();
end $$;

revoke all on function public.registrar_push_suscripcion(text, text, text, text) from public, anon;
grant execute on function public.registrar_push_suscripcion(text, text, text, text) to authenticated;

-- ── 3. Marca de envío en notificaciones ──────────────────────────────────────
-- Todo lo que ya existía se marca como enviado a propósito: es historia y no
-- queremos una avalancha de push viejos al activar esto. Después de migrar,
-- "no llega nada" hasta que nazca un aviso NUEVO: no es bug.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notificaciones' and column_name = 'push_enviada'
  ) then
    alter table public.notificaciones add column push_enviada boolean not null default false;
    update public.notificaciones set push_enviada = true;
  end if;
end $$;

create index if not exists notificaciones_push_pendiente_idx
  on public.notificaciones (creada_at) where not push_enviada;

-- ── 4. Pendientes y marcado (solo service_role) ──────────────────────────────
-- Mismas reglas que enviar_push_notificacion() (Expo):
--   · paciente: vinculaciones.notif_paciente
--   · terapeuta: notif_mensajes / notif_registros / notif_tareas
--     (crisis y vinculación siempre)
--   · no molestar: un aviso no-crisis simplemente sigue pendiente y sale
--     después (en Expo llega sin sonido; en web-push no hay "silencio").
-- Un aviso que las preferencias descartan se marca enviado aquí mismo para
-- que no se quede pendiente para siempre.
create or replace function public.push_pendientes(p_horas integer default 24)
returns table (
  id              uuid,
  destinatario_id uuid,
  tipo            text,
  titulo          text,
  cuerpo          text,
  url             text,
  endpoint        text,
  p256dh          text,
  auth            text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ahora time := localtime;   -- la BD opera en America/Mexico_City
begin
  -- Descartados por preferencias: quedan como "enviados" (no se reintentan).
  update public.notificaciones n
     set push_enviada = true
   where not n.push_enviada
     and n.creada_at > now() - make_interval(hours => p_horas)
     and (
       -- paciente que no quiere avisos (Ajustes del terapeuta → "Notificaciones al paciente")
       exists (
         select 1 from public.vinculaciones v
         where v.id = n.vinculacion_id
           and v.paciente_id = n.destinatario_id
           and not coalesce(v.notif_paciente, true)
       )
       or
       -- terapeuta que apagó ese tipo
       exists (
         select 1 from public.configuracion_terapeuta c
         where c.terapeuta_id = n.destinatario_id
           and (
             n.vinculacion_id is null
             or exists (select 1 from public.vinculaciones v2
                        where v2.id = n.vinculacion_id and v2.terapeuta_id = n.destinatario_id)
           )
           and (
             (n.tipo = 'mensaje'          and not c.notif_mensajes)
          or (n.tipo = 'registro'         and not c.notif_registros)
          or (n.tipo = 'tarea_completada' and not c.notif_tareas)
           )
       )
     );

  -- Avisos viejos: ya no tiene sentido reintentarlos.
  update public.notificaciones n
     set push_enviada = true
   where not n.push_enviada
     and n.creada_at <= now() - make_interval(hours => p_horas);

  return query
  select n.id, n.destinatario_id, n.tipo, n.titulo, n.cuerpo, n.url,
         s.endpoint, s.p256dh, s.auth
  from public.notificaciones n
  join public.push_suscripciones s on s.user_id = n.destinatario_id
  where not n.push_enviada
    and n.creada_at > now() - make_interval(hours => p_horas)
    -- "No molestar" del terapeuta: lo no-crisis espera (sigue pendiente).
    and not (
      n.tipo <> 'crisis'
      and exists (
        select 1 from public.configuracion_terapeuta c
        where c.terapeuta_id = n.destinatario_id
          and c.no_molestar_activo
          and case
                when c.no_molestar_desde <= c.no_molestar_hasta
                  then v_ahora >= c.no_molestar_desde and v_ahora < c.no_molestar_hasta
                else v_ahora >= c.no_molestar_desde or v_ahora < c.no_molestar_hasta
              end
      )
    )
  order by n.creada_at
  limit 500;
end $$;

create or replace function public.marcar_push_enviada(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  update public.notificaciones set push_enviada = true
  where id = any(p_ids) and not push_enviada;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke all on function public.push_pendientes(integer) from public, anon, authenticated;
revoke all on function public.marcar_push_enviada(uuid[]) from public, anon, authenticated;
grant execute on function public.push_pendientes(integer) to service_role;
grant execute on function public.marcar_push_enviada(uuid[]) to service_role;

-- ── 5. Trigger instantáneo (pg_net → /api/push/despachar) ────────────────────
-- En self-hosted esto NO es el "Database Webhook" de Studio: es un trigger
-- normal y se pierde al migrar la BD. Postgres debe ALCANZAR al panel por su
-- URL PUBLICA https (por nombre de contenedor falla: redes distintas).
-- ATENCION: sustituir <DOMINIO> y <CRON_SECRET> con los reales al aplicar en el VPS.
create or replace function public.push_web_al_instante()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.push_enviada then return new; end if;
  begin
    perform net.http_post(
      url     := 'https://<DOMINIO>/api/push/despachar?clave=<CRON_SECRET>',
      body    := '{}'::jsonb,
      params  := '{}'::jsonb,
      headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>',
                                    'Content-Type', 'application/json'),
      timeout_milliseconds := 5000
    );
  exception when others then
    null;  -- nunca tumbar el INSERT del aviso
  end;
  return new;
end $fn$;

drop trigger if exists trg_push_web_al_instante on public.notificaciones;
create trigger trg_push_web_al_instante
  after insert on public.notificaciones
  for each row execute function public.push_web_al_instante();

revoke execute on function public.push_web_al_instante() from public, anon, authenticated;

-- ── 6. Cron diario de respaldo (08:00 CDMX = 14:00 UTC) ──────────────────────
-- Barre lo que el trigger no alcanzó a mandar (panel caído, pg_net con error…).
do $$
begin
  perform cron.unschedule('push_web_respaldo_diario')
    where exists (select 1 from cron.job where jobname = 'push_web_respaldo_diario');
  perform cron.schedule(
    'push_web_respaldo_diario',
    '0 14 * * *',
    $cron$
      select net.http_post(
        url     := 'https://<DOMINIO>/api/push/despachar?clave=<CRON_SECRET>',
        body    := '{}'::jsonb,
        params  := '{}'::jsonb,
        headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>',
                                      'Content-Type', 'application/json'),
        timeout_milliseconds := 10000
      );
    $cron$
  );
exception when others then
  raise notice 'pg_cron no disponible o sin permisos: %', sqlerrm;
end $$;
