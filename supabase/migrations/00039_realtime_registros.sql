-- =============================================================================
-- NOEMA · 00039 · Realtime de registros emocionales (R2 · #6)
-- =============================================================================
-- Publica `registros_emocionales` en Realtime para que el terapeuta vea llegar
-- los registros de sus pacientes en el momento y pueda responder de inmediato.
--
-- ⚠️ Privacidad: Realtime aplica RLS. La política
-- `registros_terapeuta_select_compartidos` solo deja ver registros con
-- privacidad 'compartido' o 'marcado_sesion'. Los registros PRIVADOS del
-- paciente NUNCA se emiten al terapeuta.
-- Idempotente.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'registros_emocionales'
  ) then
    alter publication supabase_realtime add table public.registros_emocionales;
  end if;
end $$;
