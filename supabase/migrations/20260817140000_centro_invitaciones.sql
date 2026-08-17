-- El centro puede invitar terapeutas directamente (antes solo el terapeuta se
-- auto-vinculaba con el código). La membresía queda 'pendiente' hasta que el
-- terapeuta acepte: nadie entra a un centro sin su consentimiento.

alter table public.centro_terapeutas
  drop constraint if exists centro_terapeutas_estado_chk;
alter table public.centro_terapeutas
  add constraint centro_terapeutas_estado_chk
  check (estado in ('activa', 'inactiva', 'pendiente'));

-- Correo con el que se invitó (por si el terapeuta aún no tiene cuenta).
alter table public.centro_terapeutas
  add column if not exists email_invitado text,
  add column if not exists invitado_at timestamptz;

comment on column public.centro_terapeutas.estado is
  'pendiente = invitado por el centro, falta que el terapeuta acepte; activa = miembro; inactiva = suspendido.';
