-- =============================================================================
-- NOEMA · 00032 · Función redimir_codigo (vinculación paciente por código, #3)
-- =============================================================================
-- El paciente introduce el código que le dio el terapeuta. Esta función
-- security definer:
--   1. Valida el código (vinculación pendiente existente)
--   2. Asigna al paciente actual, activa la vinculación, crea la fila pacientes
--   3. Registra consentimiento de vinculación
--
-- Reemplaza el SELECT directo de códigos pendientes (que permitía enumerarlos).
-- =============================================================================

create or replace function public.redimir_codigo(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_vinc public.vinculaciones%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'No autenticado.');
  end if;

  -- Buscar vinculación pendiente con ese código
  select * into v_vinc
  from public.vinculaciones
  where codigo_invitacion = upper(trim(p_codigo))
    and estado = 'pendiente'
  limit 1;

  if v_vinc.id is null then
    return jsonb_build_object('ok', false, 'error', 'Código no válido o ya usado.');
  end if;

  -- ¿El paciente ya tiene una vinculación activa? (no permitir doble)
  if exists (
    select 1 from public.vinculaciones
    where paciente_id = v_uid and estado in ('activa', 'pausada')
  ) then
    return jsonb_build_object('ok', false, 'error', 'Ya tienes un terapeuta vinculado.');
  end if;

  -- Asegurar fila en pacientes (FK de vinculaciones)
  insert into public.pacientes (profile_id)
  values (v_uid)
  on conflict (profile_id) do nothing;

  -- Activar la vinculación
  update public.vinculaciones
  set paciente_id = v_uid,
      estado = 'activa',
      fecha_inicio = now(),
      consentimiento_aceptado_at = now()
  where id = v_vinc.id;

  -- Marcar al usuario como paciente
  update public.profiles
  set rol = 'paciente', onboarding_completo = true
  where id = v_uid;

  return jsonb_build_object('ok', true, 'vinculacion_id', v_vinc.id);
end;
$$;

grant execute on function public.redimir_codigo(text) to authenticated;

-- Eliminar la política que permitía enumerar códigos pendientes (fix seguridad).
drop policy if exists vinculaciones_select_por_codigo on public.vinculaciones;
