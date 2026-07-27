-- Metas del paciente: distinguir objetivos DIARIOS (lista marcable que se
-- reinicia cada día) de METAS por plazo (corto/mediano/largo).
--
-- Reusamos recordatorios_personales:
--   - tipo: 'diario' | 'corto' | 'mediano' | 'largo'
--   - recurrencia (ya existía): para 'diario' = 'diario' o letras de días 'L,M,X,J,V,S,D'
--   - completado_at (ya existía): para 'diario' define si está hecho HOY (si la
--     fecha de completado_at es hoy). Así se "reinicia" solo cada día sin cron.

ALTER TABLE public.recordatorios_personales
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'corto';

-- Índice para listar rápido por paciente + tipo.
CREATE INDEX IF NOT EXISTS idx_recordatorios_paciente_tipo
  ON public.recordatorios_personales (paciente_id, tipo);
