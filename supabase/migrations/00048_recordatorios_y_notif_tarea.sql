-- =============================================================================
-- NOEMA · 00048 · Recordatorios automáticos de registro + notif de tarea (R5)
-- =============================================================================

-- ── 1. Notificar al paciente cuando el terapeuta le deja una tarea (R5-2) ─────
create or replace function public.notificar_tarea_asignada()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_paciente uuid;
  v_notif    boolean;
begin
  select paciente_id, notif_paciente into v_paciente, v_notif
  from public.vinculaciones where id = new.vinculacion_id;

  if v_paciente is null then return new; end if;

  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    v_paciente,
    'tarea',
    'Tu terapeuta te dejó una tarea',
    new.titulo,
    new.vinculacion_id,
    '/paciente/tareas'
  );
  return new;
end $$;

drop trigger if exists trg_notificar_tarea_asignada on public.tareas;
create trigger trg_notificar_tarea_asignada
  after insert on public.tareas
  for each row execute function public.notificar_tarea_asignada();

-- ── 2. Recordatorios automáticos de registro emocional (R5-1) ────────────────
-- Si el paciente no llega a 3 registros HOY (hora CDMX; la BD ya opera en
-- America/Mexico_City), o no ha registrado nada en 2 días (tendencia distante),
-- se le manda un recordatorio amable. Máximo uno por día.
create or replace function public.enviar_recordatorios_registro()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count int := 0;
  r record;
  v_hoy int;
  v_ult date;
  v_titulo text;
  v_cuerpo text;
begin
  for r in
    select v.id as vinc_id, v.paciente_id, p.nombre
    from public.vinculaciones v
    join public.profiles p on p.id = v.paciente_id
    where v.estado = 'activa'
      and coalesce(v.notif_paciente, true) = true
      and coalesce(v.registros_habilitados, true) = true
  loop
    -- ¿ya se le envió recordatorio hoy?
    if exists (
      select 1 from public.notificaciones n
      where n.destinatario_id = r.paciente_id
        and n.tipo = 'recordatorio'
        and n.creada_at::date = current_date
    ) then
      continue;
    end if;

    select count(*) into v_hoy
    from public.registros_emocionales
    where paciente_id = r.paciente_id and fecha = current_date;

    select max(fecha) into v_ult
    from public.registros_emocionales
    where paciente_id = r.paciente_id;

    -- Ya cumplió la meta de hoy → no molestar.
    if v_hoy >= 3 then continue; end if;

    if v_ult is null or v_ult < current_date - 1 then
      -- Tendencia distante: hace días que no registra.
      v_titulo := 'Te extrañamos por aquí';
      v_cuerpo := 'Hace un par de días que no registras cómo te sientes. Un minuto basta: ¿cómo estás hoy?';
    else
      -- Hoy va corto de registros.
      v_titulo := '¿Cómo te sientes hoy?';
      v_cuerpo := 'Registrar tus emociones te ayuda a conocerte y a tu terapeuta a acompañarte. Toma un momento para anotar una.';
    end if;

    insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
    values (r.paciente_id, 'recordatorio', v_titulo, v_cuerpo, r.vinc_id, '/paciente/registros');
    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;

-- ── 3. Programar el recordatorio diario (pg_cron) ────────────────────────────
-- Se ejecuta 02:00 UTC = 20:00 en CDMX (por la tarde-noche). Si pg_cron no está
-- disponible, la función queda igual y se puede llamar manualmente.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('recordatorios_registro_diario')
    where exists (select 1 from cron.job where jobname = 'recordatorios_registro_diario');
  perform cron.schedule(
    'recordatorios_registro_diario',
    '0 2 * * *',
    $cron$ select public.enviar_recordatorios_registro(); $cron$
  );
exception when others then
  raise notice 'pg_cron no disponible o sin permisos: %', sqlerrm;
end $$;
