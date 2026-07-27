-- PLAN DE APOYO (reemplaza el "botón de crisis").
-- 3 tablas: el plan (1 por vínculo), sus recursos, y el registro de usos.

-- 1) Plan de apoyo: contacto de emergencia + plan de seguridad + preferencia de aviso.
CREATE TABLE IF NOT EXISTS public.plan_apoyo (
  vinculacion_id uuid PRIMARY KEY REFERENCES public.vinculaciones(id) ON DELETE CASCADE,
  contacto_nombre text,
  contacto_relacion text,
  contacto_telefono text,
  plan_seguridad text NOT NULL DEFAULT '',
  notificar_uso boolean NOT NULL DEFAULT true,
  plan_editado_por_paciente_at timestamptz,
  actualizado_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Recursos definidos por el terapeuta.
CREATE TABLE IF NOT EXISTS public.plan_apoyo_recursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vinculacion_id uuid NOT NULL REFERENCES public.vinculaciones(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'otro', -- respiracion|audio|video|documento|imagen|recordatorio|enlace|otro
  titulo text NOT NULL,
  url text,
  nota text,
  creado_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_plan_apoyo_recursos_vinc ON public.plan_apoyo_recursos (vinculacion_id, creado_at);

-- 3) Registro de usos del plan (evento en el expediente) + retroalimentación.
CREATE TABLE IF NOT EXISTS public.plan_apoyo_usos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vinculacion_id uuid NOT NULL REFERENCES public.vinculaciones(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usado_at timestamptz NOT NULL DEFAULT now(),
  retroalimentacion text,
  retro_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_plan_apoyo_usos_vinc ON public.plan_apoyo_usos (vinculacion_id, usado_at DESC);

-- ─── RLS ───
ALTER TABLE public.plan_apoyo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_apoyo_recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_apoyo_usos ENABLE ROW LEVEL SECURITY;

-- plan_apoyo: ambas partes del vínculo pueden ver y editar.
DROP POLICY IF EXISTS plan_apoyo_partes ON public.plan_apoyo;
CREATE POLICY plan_apoyo_partes ON public.plan_apoyo FOR ALL
  USING (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo.vinculacion_id AND (v.terapeuta_id = auth.uid() OR v.paciente_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo.vinculacion_id AND (v.terapeuta_id = auth.uid() OR v.paciente_id = auth.uid())));

-- recursos: el paciente los ve; el terapeuta los gestiona.
DROP POLICY IF EXISTS recursos_select ON public.plan_apoyo_recursos;
CREATE POLICY recursos_select ON public.plan_apoyo_recursos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo_recursos.vinculacion_id AND (v.terapeuta_id = auth.uid() OR v.paciente_id = auth.uid())));
DROP POLICY IF EXISTS recursos_terapeuta ON public.plan_apoyo_recursos;
CREATE POLICY recursos_terapeuta ON public.plan_apoyo_recursos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo_recursos.vinculacion_id AND v.terapeuta_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo_recursos.vinculacion_id AND v.terapeuta_id = auth.uid()));

-- usos: ambos ven; el paciente inserta; el terapeuta actualiza (feedback).
DROP POLICY IF EXISTS usos_select ON public.plan_apoyo_usos;
CREATE POLICY usos_select ON public.plan_apoyo_usos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo_usos.vinculacion_id AND (v.terapeuta_id = auth.uid() OR v.paciente_id = auth.uid())));
DROP POLICY IF EXISTS usos_paciente_insert ON public.plan_apoyo_usos;
CREATE POLICY usos_paciente_insert ON public.plan_apoyo_usos FOR INSERT
  WITH CHECK (paciente_id = auth.uid() AND EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo_usos.vinculacion_id AND v.paciente_id = auth.uid()));
DROP POLICY IF EXISTS usos_terapeuta_update ON public.plan_apoyo_usos;
CREATE POLICY usos_terapeuta_update ON public.plan_apoyo_usos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo_usos.vinculacion_id AND v.terapeuta_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vinculaciones v WHERE v.id = plan_apoyo_usos.vinculacion_id AND v.terapeuta_id = auth.uid()));
