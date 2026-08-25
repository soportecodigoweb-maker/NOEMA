-- Las observaciones de supervisión pueden referirse a un paciente y a una
-- sección concreta, para que el terapeuta sepa exactamente a qué se refieren.
alter table public.supervision_comentarios
  add column if not exists vinculacion_id uuid references public.vinculaciones(id) on delete set null,
  add column if not exists contexto text;
