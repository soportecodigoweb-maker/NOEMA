-- El terapeuta puede dejar un mensaje/retroalimentación a un registro emocional
-- del paciente. El paciente lo ve en sus registros.
alter table public.registros_emocionales
  add column if not exists retroalimentacion text,
  add column if not exists retroalimentacion_at timestamptz,
  add column if not exists retroalimentacion_por uuid references public.profiles(id) on delete set null;
