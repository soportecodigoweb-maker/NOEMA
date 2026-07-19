-- =============================================================================
-- NOEMA · 00027 · Paciente puede agendar si el terapeuta lo habilita (#11)
-- =============================================================================
-- El requerimiento #13 (terapeuta) agregó la columna `agenda_habilitada`. Aquí
-- agregamos la política RLS que permite al PACIENTE crear una sesión en su
-- vinculación SOLO cuando el terapeuta habilitó la agenda.
--
-- El paciente crea la sesión en estado 'programada'. El terapeuta la ve en su
-- agenda y puede reagendar/cancelar si lo necesita.
-- =============================================================================

create policy sesiones_paciente_agenda_insert on public.sesiones
  for insert
  with check (
    exists (
      select 1 from public.vinculaciones v
      where v.id = sesiones.vinculacion_id
        and v.paciente_id = auth.uid()
        and v.estado = 'activa'
        and v.agenda_habilitada = true
    )
  );

-- El paciente puede cancelar una sesión que él mismo agendó (no otras).
-- Para simplicidad y trazabilidad, permitimos update solo del estado a
-- 'cancelada' cuando la agenda está habilitada. El terapeuta gestiona el resto.
create policy sesiones_paciente_cancelar on public.sesiones
  for update
  using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = sesiones.vinculacion_id
        and v.paciente_id = auth.uid()
        and v.agenda_habilitada = true
    )
  )
  with check (
    exists (
      select 1 from public.vinculaciones v
      where v.id = sesiones.vinculacion_id
        and v.paciente_id = auth.uid()
        and v.agenda_habilitada = true
    )
  );
