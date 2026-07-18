-- Fix crítico de seguridad: bloquear escalación de rol via signup.
--
-- Bug: el trigger handle_new_auth_user tomaba `rol` directamente de
-- raw_user_meta_data sin validar, permitiendo que un usuario se registrara
-- con { data: { rol: 'admin' } } y pasara los checks de rol.
--
-- Fix: solo permitir los roles no-privilegiados desde signup público.
-- El rol 'terapeuta' se debe asignar server-side tras validar (email de dominio,
-- código de invitación, etc.). El rol 'admin' NUNCA se asigna via signup.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol_solicitado text;
  rol_asignado rol_usuario;
begin
  rol_solicitado := new.raw_user_meta_data->>'rol';

  -- Whitelist estricta: solo estos roles pueden auto-asignarse via signup.
  -- 'terapeuta' se debe promocionar via flujo server-side (cuenta creada por
  -- admin/backoffice o tras validación). 'admin' NUNCA se asigna via signup.
  if rol_solicitado in ('paciente', 'sin_terapeuta') then
    rol_asignado := rol_solicitado::rol_usuario;
  else
    -- Cualquier otro valor (incluyendo 'admin', 'terapeuta', null, valores
    -- inválidos) cae al default seguro.
    rol_asignado := 'sin_terapeuta';
  end if;

  insert into public.profiles (id, email, rol, nombre)
  values (
    new.id,
    new.email,
    rol_asignado,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
