-- =============================================================================
-- NOEMA · 00016 · Triggers de coherencia
-- =============================================================================
-- Triggers que mantienen contadores cacheados, "última actividad" del terapeuta
-- y otros campos derivados.
-- =============================================================================

-- Mantener terapeutas.pacientes_activos_count -------------------------------

create or replace function public.recontar_pacientes_activos(p_terapeuta_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.terapeutas
  set pacientes_activos_count = (
    select count(*) from public.vinculaciones
    where terapeuta_id = p_terapeuta_id and estado = 'activa'
  )
  where profile_id = p_terapeuta_id;
$$;

create or replace function public.vinculaciones_actualizar_conteo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.recontar_pacientes_activos(new.terapeuta_id);
  elsif tg_op = 'UPDATE' then
    perform public.recontar_pacientes_activos(new.terapeuta_id);
    if new.terapeuta_id <> old.terapeuta_id then
      perform public.recontar_pacientes_activos(old.terapeuta_id);
    end if;
  elsif tg_op = 'DELETE' then
    perform public.recontar_pacientes_activos(old.terapeuta_id);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger vinculaciones_conteo_trigger
  after insert or update of estado, terapeuta_id or delete on public.vinculaciones
  for each row execute function public.vinculaciones_actualizar_conteo();

-- Mantener terapeutas.ultima_actividad ----------------------------------------

create or replace function public.actualizar_ultima_actividad_terapeuta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_terapeuta_id uuid;
begin
  if tg_table_name = 'sesion_notas' then
    select v.terapeuta_id into v_terapeuta_id
    from public.sesiones s
    join public.vinculaciones v on v.id = s.vinculacion_id
    where s.id = new.sesion_id;
  elsif tg_table_name = 'tareas' then
    select v.terapeuta_id into v_terapeuta_id
    from public.vinculaciones v
    where v.id = new.vinculacion_id;
  elsif tg_table_name = 'mensajes' then
    select v.terapeuta_id into v_terapeuta_id
    from public.vinculaciones v
    where v.id = new.vinculacion_id;
    if v_terapeuta_id <> new.autor_id then
      v_terapeuta_id := null; -- mensaje del paciente, no cuenta como actividad del terapeuta
    end if;
  end if;

  if v_terapeuta_id is not null then
    update public.terapeutas
    set ultima_actividad = now()
    where profile_id = v_terapeuta_id;
  end if;

  return new;
end;
$$;

create trigger terapeuta_actividad_notas
  after insert or update on public.sesion_notas
  for each row execute function public.actualizar_ultima_actividad_terapeuta();

create trigger terapeuta_actividad_tareas
  after insert on public.tareas
  for each row execute function public.actualizar_ultima_actividad_terapeuta();

create trigger terapeuta_actividad_mensajes
  after insert on public.mensajes
  for each row execute function public.actualizar_ultima_actividad_terapeuta();

-- Actualizar usos_count de plantillas cuando se usan en tareas ---------------

create or replace function public.incrementar_usos_plantilla()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plantilla_id is not null then
    update public.plantillas_ejercicios
    set usos_count = usos_count + 1
    where id = new.plantilla_id;
  end if;
  return new;
end;
$$;

create trigger tareas_incrementar_usos_plantilla
  after insert on public.tareas
  for each row execute function public.incrementar_usos_plantilla();

-- Cálculo del ranking_score del directorio -----------------------------------
-- Score = (perfil_completo * 30) + (verificado * 30) + log(pacientes_activos) * 10
--         + (actividad_reciente_dias_inversa) * 20 + (acepta_nuevos * 10)
-- Resultado ~ [0..100]

create or replace function public.calcular_ranking_terapeuta(p_terapeuta_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_t public.terapeutas;
  v_p public.profiles;
  v_score numeric := 0;
  v_perfil_completo boolean;
  v_dias_inactivo int;
begin
  select * into v_t from public.terapeutas where profile_id = p_terapeuta_id;
  select * into v_p from public.profiles where id = p_terapeuta_id;

  if v_t is null then return 0; end if;

  -- Perfil completo (30 pts)
  v_perfil_completo := (
    coalesce(length(v_t.descripcion), 0) > 80
    and array_length(v_t.especialidades, 1) > 0
    and array_length(v_t.enfoques, 1) > 0
    and v_t.precio_sesion_mxn is not null
    and v_p.avatar_url is not null
  );
  if v_perfil_completo then v_score := v_score + 30; end if;

  -- Verificado (30 pts)
  if v_t.estado_verificacion = 'verificado' then v_score := v_score + 30; end if;

  -- Pacientes activos (hasta 10 pts, escala log)
  v_score := v_score + least(10, ln(v_t.pacientes_activos_count + 1) * 3);

  -- Actividad reciente (hasta 20 pts)
  if v_t.ultima_actividad is not null then
    v_dias_inactivo := extract(day from now() - v_t.ultima_actividad)::int;
    v_score := v_score + greatest(0, 20 - v_dias_inactivo);
  end if;

  -- Acepta nuevos pacientes (10 pts)
  if v_t.acepta_nuevos_pacientes then v_score := v_score + 10; end if;

  return v_score;
end;
$$;

-- Job manual: recalcular ranking de todos los terapeutas (correr periódicamente)
create or replace function public.recalcular_ranking_terapeutas()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_count int := 0;
begin
  for v_id in select profile_id from public.terapeutas loop
    update public.terapeutas
    set ranking_score = public.calcular_ranking_terapeuta(v_id)
    where profile_id = v_id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

grant execute on function public.recalcular_ranking_terapeutas() to authenticated;

-- Permisos generales --------------------------------------------------------

-- Las funciones helper deben ser ejecutables por el rol autenticado
grant usage on schema public to authenticated, anon;
grant execute on function public.set_actualizado_at() to authenticated;
grant execute on function public.mi_rol() to authenticated;
grant execute on function public.es_terapeuta_de(uuid) to authenticated;
grant execute on function public.es_terapeuta_verificado(uuid) to authenticated;
grant execute on function public.paciente_autoriza_alerta_crisis(uuid) to authenticated;
grant execute on function public.soy_parte_de_sesion(uuid) to authenticated;
