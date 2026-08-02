-- Acceso al Panel de Dueño por bandera, no por rol.
-- Así una cuenta puede conservar su rol (p. ej. terapeuta) y además tener
-- acceso de dueño a /owner. Solo se otorga manualmente por SQL.

alter table public.profiles
  add column if not exists es_dueno boolean not null default false;

comment on column public.profiles.es_dueno is
  'Si es true, la cuenta puede entrar al Panel de Dueño (/owner). Se otorga manualmente.';
