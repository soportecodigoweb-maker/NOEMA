-- =============================================================================
-- NOEMA · 00051 · Modo aprendiz (tour guiado) (R6-4)
-- =============================================================================
-- Preferencia por usuario para mostrar u ocultar la guía paso a paso de cada
-- función. Aplica a cualquier rol. Activo por defecto para nuevos usuarios.
-- =============================================================================

alter table public.profiles
  add column if not exists modo_aprendiz boolean not null default true;

comment on column public.profiles.modo_aprendiz is
  'Si el usuario ve el tour guiado (modo aprendiz). Se puede activar/desactivar.';
