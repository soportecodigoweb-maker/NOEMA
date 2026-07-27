-- Notas privadas del terapeuta: pasar de UNA nota por paciente a VARIAS
-- (idealmente una por sesión). Nueva tabla notas_privadas.

CREATE TABLE IF NOT EXISTS public.notas_privadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vinculacion_id uuid NOT NULL REFERENCES public.vinculaciones(id) ON DELETE CASCADE,
  terapeuta_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo text,
  contenido text NOT NULL DEFAULT '',
  creado_at timestamptz NOT NULL DEFAULT now(),
  actualizado_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_privadas_vinc
  ON public.notas_privadas (vinculacion_id, creado_at DESC);

ALTER TABLE public.notas_privadas ENABLE ROW LEVEL SECURITY;

-- Solo el terapeuta del vínculo puede ver/editar sus notas privadas.
DROP POLICY IF EXISTS notas_privadas_terapeuta ON public.notas_privadas;
CREATE POLICY notas_privadas_terapeuta ON public.notas_privadas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vinculaciones v
      WHERE v.id = notas_privadas.vinculacion_id AND v.terapeuta_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vinculaciones v
      WHERE v.id = notas_privadas.vinculacion_id AND v.terapeuta_id = auth.uid()
    )
  );

-- Migrar la nota única existente (si tiene contenido) como primera nota.
INSERT INTO public.notas_privadas (vinculacion_id, terapeuta_id, titulo, contenido)
SELECT n.vinculacion_id, v.terapeuta_id, 'Nota general', n.contenido
FROM public.vinculacion_notas_privadas n
JOIN public.vinculaciones v ON v.id = n.vinculacion_id
WHERE n.contenido IS NOT NULL AND btrim(n.contenido) <> '';
