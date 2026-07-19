-- =============================================================================
-- NOEMA · 00028 · Retroalimentación del terapeuta a las respuestas (#4 paciente)
-- =============================================================================
-- El paciente responde una tarea (tarea_respuestas). El terapeuta puede dejar
-- una retroalimentación breve sobre esa respuesta, que el paciente ve.
-- =============================================================================

alter table public.tarea_respuestas
  add column if not exists retroalimentacion       text,
  add column if not exists retroalimentacion_por   uuid references public.profiles(id),
  add column if not exists retroalimentacion_at    timestamptz;

comment on column public.tarea_respuestas.retroalimentacion is
  'Comentario del terapeuta sobre la respuesta del paciente. Visible para el paciente.';

-- RLS: el terapeuta de la vinculación puede actualizar la respuesta para dejar
-- retroalimentación. Verificamos vía la tarea → vinculación → terapeuta.
-- (La política existente ya deja al paciente gestionar sus respuestas.)
do $$ begin
  create policy tarea_respuestas_terapeuta_feedback on public.tarea_respuestas
    for update
    using (
      exists (
        select 1
        from public.tareas t
        join public.vinculaciones v on v.id = t.vinculacion_id
        where t.id = tarea_respuestas.tarea_id
          and v.terapeuta_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.tareas t
        join public.vinculaciones v on v.id = t.vinculacion_id
        where t.id = tarea_respuestas.tarea_id
          and v.terapeuta_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- El terapeuta también debe poder LEER las respuestas compartidas de sus
-- pacientes (para verlas y retroalimentar).
do $$ begin
  create policy tarea_respuestas_terapeuta_select on public.tarea_respuestas
    for select
    using (
      compartir_terapeuta = true
      and exists (
        select 1
        from public.tareas t
        join public.vinculaciones v on v.id = t.vinculacion_id
        where t.id = tarea_respuestas.tarea_id
          and v.terapeuta_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;
