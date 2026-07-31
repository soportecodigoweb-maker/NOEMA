-- Borrado de cuenta = "bloquear y archivar" (decisión de Javier, jul 2026).
-- En lugar de eliminación total, al borrar: se revoca el acceso (vinculaciones
-- finalizadas), se bloquea el ingreso (ban en Auth) y la cuenta queda marcada
-- como 'eliminada'. Los datos se conservan bloqueados por obligación legal.

alter table public.profiles
  add column if not exists estado_cuenta text not null default 'activa',
  add column if not exists eliminada_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_estado_cuenta_chk;
alter table public.profiles
  add constraint profiles_estado_cuenta_chk
  check (estado_cuenta in ('activa', 'eliminada'));

comment on column public.profiles.estado_cuenta is
  'activa | eliminada. "eliminada" = cuenta bloqueada y archivada: sin acceso para el usuario ni para terapeutas/centros; los datos se conservan bloqueados por obligación legal.';
comment on column public.profiles.eliminada_at is
  'Momento en que el usuario solicitó eliminar su cuenta (inicio del bloqueo/archivo).';
