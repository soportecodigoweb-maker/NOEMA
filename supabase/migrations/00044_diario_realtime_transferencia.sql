-- =============================================================================
-- NOEMA · 00044 · Diario compartido (notif), tareas en tiempo real, transferencia
-- =============================================================================

-- ── 1. Notificación cuando el paciente comparte una entrada de diario (R3-2) ──
create or replace function public.notificar_diario_compartido()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_vinc      uuid;
  v_terapeuta uuid;
  v_paciente  text;
begin
  -- Solo si la entrada quedó compartida / marcada para sesión…
  if new.privacidad not in ('compartido', 'marcado_sesion') then
    return new;
  end if;
  -- …y en UPDATE, solo si ANTES no lo estaba (evita duplicar avisos al editar).
  if tg_op = 'UPDATE' and old.privacidad in ('compartido', 'marcado_sesion') then
    return new;
  end if;

  select id, terapeuta_id into v_vinc, v_terapeuta
  from public.vinculaciones
  where paciente_id = new.paciente_id and estado = 'activa'
  limit 1;
  if v_terapeuta is null then return new; end if;

  select nombre into v_paciente from public.profiles where id = new.paciente_id;

  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    v_terapeuta,
    'diario',
    coalesce(v_paciente, 'Un paciente') || ' compartió una entrada de diario',
    coalesce(new.titulo, left(new.contenido, 120)),
    v_vinc,
    '/pacientes/' || v_vinc::text || '/diario'
  );
  return new;
end $$;

drop trigger if exists trg_notificar_diario on public.diario_entradas;
create trigger trg_notificar_diario
  after insert or update of privacidad on public.diario_entradas
  for each row execute function public.notificar_diario_compartido();

-- ── 2. Tareas en tiempo real (R3-5) ──────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='tareas') then
    alter publication supabase_realtime add table public.tareas;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='tarea_respuestas') then
    alter publication supabase_realtime add table public.tarea_respuestas;
  end if;
end $$;

-- ── 3. Transferencia de paciente a otro terapeuta por cédula (R3-3) ───────────
-- Auditoría de cada transferencia (nada se pierde: queda registro).
create table if not exists public.transferencias (
  id                uuid primary key default gen_random_uuid(),
  vinculacion_id    uuid not null references public.vinculaciones(id) on delete cascade,
  terapeuta_origen  uuid not null references public.profiles(id),
  terapeuta_destino uuid not null references public.profiles(id),
  motivo            text,
  creada_at         timestamptz not null default now()
);

alter table public.transferencias enable row level security;

drop policy if exists transferencias_involucrados on public.transferencias;
create policy transferencias_involucrados on public.transferencias
  for select using (terapeuta_origen = auth.uid() or terapeuta_destino = auth.uid());

-- Índice para buscar terapeutas por su cédula (código único de transferencia).
create unique index if not exists terapeutas_cedula_unica_idx
  on public.terapeutas (cedula_profesional)
  where cedula_profesional is not null;

/**
 * Transfiere un paciente (y todo su historial, que cuelga de vinculacion_id) a
 * otro terapeuta identificado por su cédula profesional.
 *
 * Solo el terapeuta actual de la vinculación puede transferir. Como todo el
 * expediente (notas, sesiones, tareas, expediente inicial, adjuntos) referencia
 * vinculacion_id, basta con cambiar terapeuta_id para que el historial viaje.
 */
create or replace function public.transferir_paciente(
  p_vinculacion_id uuid,
  p_cedula_destino text,
  p_motivo text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_origen   uuid;
  v_destino  uuid;
  v_paciente uuid;
  v_nombre_origen text;
begin
  -- 1. Verificar que quien llama es el terapeuta actual.
  select terapeuta_id, paciente_id into v_origen, v_paciente
  from public.vinculaciones where id = p_vinculacion_id;

  if v_origen is null then
    return jsonb_build_object('ok', false, 'error', 'Vinculación no encontrada.');
  end if;
  if v_origen <> auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'No puedes transferir este paciente.');
  end if;

  -- 2. Buscar al terapeuta destino por su cédula.
  select profile_id into v_destino
  from public.terapeutas
  where cedula_profesional = trim(p_cedula_destino);

  if v_destino is null then
    return jsonb_build_object('ok', false, 'error', 'No hay ningún terapeuta con esa cédula.');
  end if;
  if v_destino = v_origen then
    return jsonb_build_object('ok', false, 'error', 'Ese ya es el terapeuta del paciente.');
  end if;

  -- 3. Mover la vinculación (arrastra todo el historial por vinculacion_id).
  update public.vinculaciones set terapeuta_id = v_destino where id = p_vinculacion_id;

  -- 4. Registrar la transferencia (auditoría) y notificar a ambos.
  insert into public.transferencias (vinculacion_id, terapeuta_origen, terapeuta_destino, motivo)
  values (p_vinculacion_id, v_origen, v_destino, p_motivo);

  select nombre into v_nombre_origen from public.profiles where id = v_origen;

  -- Notificar al terapeuta destino
  insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
  values (
    v_destino, 'vinculacion',
    'Te transfirieron un paciente',
    coalesce(v_nombre_origen, 'Otro terapeuta') || ' te transfirió un paciente con su historial.',
    p_vinculacion_id, '/pacientes/' || p_vinculacion_id::text
  );

  -- Notificar al paciente para que esté enterado
  if v_paciente is not null then
    insert into public.notificaciones (destinatario_id, tipo, titulo, cuerpo, vinculacion_id, url)
    values (
      v_paciente, 'vinculacion',
      'Tu seguimiento fue transferido',
      'Tu terapeuta transfirió tu seguimiento a otro profesional dentro de NOEMA.',
      p_vinculacion_id, '/paciente'
    );
  end if;

  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.transferir_paciente(uuid, text, text) from public, anon;
grant execute on function public.transferir_paciente(uuid, text, text) to authenticated;
