-- Ejercicios en formato TABLA (p. ej. "Auto-registro: situación, emoción y
-- pensamiento"). El terapeuta define las columnas y el paciente responde
-- llenando filas.

alter table public.tareas
  add column if not exists tabla_columnas jsonb;

comment on column public.tareas.tabla_columnas is
  'Si no es null, la tarea se responde como tabla. Formato: [{"key":"c1","label":"Situación"}, ...]';
