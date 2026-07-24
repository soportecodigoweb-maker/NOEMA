-- =============================================================================
-- NOEMA · 00041 · Centro de notificaciones
-- =============================================================================
-- Registra en la BD cada evento relevante para que el terapeuta (y el paciente)
-- lo vean en la campana, en tiempo real.
--
-- Se generan con TRIGGERS, no desde el navegador: así queda registrado siempre,
-- sin importar si el evento vino de la web, del móvil o de un proceso interno.
-- Idempotente.
-- =============================================================================

create table if not exists public.notificaciones (
  id              uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  -- 'mensaje' | 'registro' | 'crisis' | 'tarea_completada' | 'vinculacion'
  tipo            text not null,
  titulo          text not null,
  cuerpo          text,
  vinculacion_id  uuid references public.vinculaciones(id) on delete cascade,
  url             text,          -- a dónde lleva al hacer clic
  leida_at        timestamptz,
  creada_at       timestamptz not null default now()
);

comment on table public.notificaciones is
  'Centro de notificaciones. Se alimenta por triggers para que todo evento quede registrado.';

create index if not exists notificaciones_destinatario_idx
  on public.notificaciones (destinatario_id, creada_at desc);
create index if not exists notificaciones_no_leidas_idx
  on public.notificaciones (destinatario_id) where leida_at is null;

alter table public.notificaciones enable row level security;

-- Cada quien ve y marca como leídas SOLO sus notificaciones.
drop policy if exists notificaciones_propias on public.notificaciones;
create policy notificaciones_propias on public.notificaciones
  for select using (destinatario_id = auth.uid());

drop policy if exists notificaciones_marcar_leida on public.notificaciones;
create policy notificaciones_marcar_leida on public.notificaciones
  for update using (destinatario_id = auth.uid())
  with check (destinatario_id = auth.uid());

-- Realtime: la campana se actualiza al instante.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notificaciones'
  ) then
    alter publication supabase_realtime add table public.notificaciones;
  end if;
end $$;

-- =============================================================================
-- TRIGGERS — cada evento genera su notificación
-- =============================================================================
-- security definer: quien dispara el evento no es el destinatario, así que la
-- inserción debe poder saltarse la RLS de forma controlada.

-- ── 1. Mensaje nuevo → avisa a la otra parte ─────────────────────────────────
create or replace function public.notificar_mensaje()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_terapeuta uuid;
  v_paciente  uuid;
  v_destino   uuid;
  v_autor     text;
begin
  select terapeuta_id, paciente_id into v_terapeuta, v_paciente
  from public.vinculaciones where id = new.vinculacion_id;

  -- El destinatario es la contraparte del autor.
  v_destino := case when new.autor_id = v_terapeuta then v_paciente else v_terapeuta end;
  if v_destino is null or v_destino = new.autor_id then return new; end if;

  select nombre into v_autor from public.profiles where id = new.autor_id;

  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    v_destino,
    'mensaje',
    coalesce(v_autor, 'Alguien') || ' te escribió',
    left(new.contenido, 140),
    new.vinculacion_id,
    case when v_destino = v_terapeuta
         then '/mensajes/' || new.vinculacion_id::text
         else '/paciente/mensajes' end
  );
  return new;
end $$;

drop trigger if exists trg_notificar_mensaje on public.mensajes;
create trigger trg_notificar_mensaje
  after insert on public.mensajes
  for each row execute function public.notificar_mensaje();

-- ── 2. Registro emocional compartido → avisa al terapeuta ────────────────────
create or replace function public.notificar_registro()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_vinc      uuid;
  v_terapeuta uuid;
  v_paciente  text;
begin
  -- Solo si el paciente decidió compartirlo (nunca los privados).
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
    '/pacientes/' || v_vinc::text || '/registros'
  );
  return new;
end $$;

drop trigger if exists trg_notificar_registro on public.registros_emocionales;
create trigger trg_notificar_registro
  after insert on public.registros_emocionales
  for each row execute function public.notificar_registro();

-- ── 3. Alerta de crisis → avisa al terapeuta (si el paciente lo autorizó) ─────
create or replace function public.notificar_crisis()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_terapeuta uuid;
  v_paciente  text;
begin
  if not new.notificado_terapeuta or new.vinculacion_id is null then return new; end if;

  select terapeuta_id into v_terapeuta
  from public.vinculaciones where id = new.vinculacion_id;
  if v_terapeuta is null then return new; end if;

  select nombre into v_paciente from public.profiles where id = new.paciente_id;

  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    v_terapeuta,
    'crisis',
    coalesce(v_paciente, 'Un paciente') || ' pidió apoyo',
    coalesce(new.contexto, 'Activó el botón de apoyo.'),
    new.vinculacion_id,
    '/mensajes/' || new.vinculacion_id::text
  );
  return new;
end $$;

drop trigger if exists trg_notificar_crisis on public.alertas_crisis;
create trigger trg_notificar_crisis
  after insert on public.alertas_crisis
  for each row execute function public.notificar_crisis();

-- ── 4. Tarea completada → avisa al terapeuta ─────────────────────────────────
create or replace function public.notificar_tarea_completada()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_terapeuta uuid;
  v_paciente_id uuid;
  v_paciente  text;
begin
  if new.estado <> 'completada' or old.estado = 'completada' then return new; end if;

  select terapeuta_id, paciente_id into v_terapeuta, v_paciente_id
  from public.vinculaciones where id = new.vinculacion_id;
  if v_terapeuta is null then return new; end if;

  select nombre into v_paciente from public.profiles where id = v_paciente_id;

  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    v_terapeuta,
    'tarea_completada',
    coalesce(v_paciente, 'Un paciente') || ' completó una tarea',
    new.titulo,
    new.vinculacion_id,
    '/pacientes/' || new.vinculacion_id::text || '/ejercicios'
  );
  return new;
end $$;

drop trigger if exists trg_notificar_tarea on public.tareas;
create trigger trg_notificar_tarea
  after update of estado on public.tareas
  for each row execute function public.notificar_tarea_completada();

-- ── 5. Vinculación activada → avisa al terapeuta ─────────────────────────────
create or replace function public.notificar_vinculacion()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_paciente text;
begin
  if new.estado <> 'activa' or old.estado = 'activa' or new.paciente_id is null then
    return new;
  end if;

  select nombre into v_paciente from public.profiles where id = new.paciente_id;

  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    new.terapeuta_id,
    'vinculacion',
    coalesce(v_paciente, 'Un paciente') || ' se vinculó contigo',
    'Ya puedes darle seguimiento desde su ficha.',
    new.id,
    '/pacientes/' || new.id::text
  );
  return new;
end $$;

drop trigger if exists trg_notificar_vinculacion on public.vinculaciones;
create trigger trg_notificar_vinculacion
  after update of estado on public.vinculaciones
  for each row execute function public.notificar_vinculacion();
