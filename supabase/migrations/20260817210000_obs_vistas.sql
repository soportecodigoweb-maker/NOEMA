-- El terapeuta marca como vista una observación de supervisión, para que el
-- centro sepa que ya la leyó.
alter table public.supervision_comentarios
  add column if not exists visto_at timestamptz;
