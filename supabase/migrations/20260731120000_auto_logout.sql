-- Preferencia de auto-cierre de sesión por inactividad (opt-in del usuario).
-- Aplica a paciente y terapeuta (columna en profiles, común a ambos roles).

alter table public.profiles
  add column if not exists auto_logout_habilitado boolean not null default false;

comment on column public.profiles.auto_logout_habilitado is
  'Si es true, la sesión web se cierra automáticamente tras 10 min de inactividad. Opt-in configurable en Ajustes.';
