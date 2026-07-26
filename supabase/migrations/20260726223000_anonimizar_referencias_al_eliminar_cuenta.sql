-- Anonimizar referencias de autoría al eliminar una cuenta.
--
-- Problema: 12 FKs hacia public.profiles estaban en NO ACTION, así que eliminar
-- una cuenta con actividad quedaba bloqueado ("No se pudo eliminar la cuenta").
--
-- Decisión (datos clínicos): al eliminar una cuenta se conserva el registro
-- ligado a OTRAS personas y solo se anula "quién lo hizo" (queda como
-- "usuario eliminado"). Por eso pasamos estas FKs a ON DELETE SET NULL.
-- Las columnas NOT NULL se hacen nullable para permitir el SET NULL.
-- (Los datos PROPIOS del usuario siguen borrándose por las cascadas ya existentes.)

BEGIN;

-- 1) Permitir NULL en columnas de autoría que hoy lo prohíben
ALTER TABLE public.adjuntos           ALTER COLUMN subido_por        DROP NOT NULL;
ALTER TABLE public.mensajes           ALTER COLUMN autor_id          DROP NOT NULL;
ALTER TABLE public.recursos_asignados ALTER COLUMN asignado_por      DROP NOT NULL;
ALTER TABLE public.resumenes_ia       ALTER COLUMN generado_por      DROP NOT NULL;
ALTER TABLE public.sesion_notas       ALTER COLUMN autor_id          DROP NOT NULL;
ALTER TABLE public.tareas             ALTER COLUMN asignada_por      DROP NOT NULL;
ALTER TABLE public.transferencias     ALTER COLUMN terapeuta_origen  DROP NOT NULL;
ALTER TABLE public.transferencias     ALTER COLUMN terapeuta_destino DROP NOT NULL;

-- 2) Recrear cada FK con ON DELETE SET NULL
ALTER TABLE public.adjuntos DROP CONSTRAINT adjuntos_subido_por_fkey,
  ADD CONSTRAINT adjuntos_subido_por_fkey
  FOREIGN KEY (subido_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.audit_log DROP CONSTRAINT audit_log_actor_id_fkey,
  ADD CONSTRAINT audit_log_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.expediente_inicial DROP CONSTRAINT expediente_inicial_elaborado_por_fkey,
  ADD CONSTRAINT expediente_inicial_elaborado_por_fkey
  FOREIGN KEY (elaborado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.mensajes DROP CONSTRAINT mensajes_autor_id_fkey,
  ADD CONSTRAINT mensajes_autor_id_fkey
  FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.recursos_asignados DROP CONSTRAINT recursos_asignados_asignado_por_fkey,
  ADD CONSTRAINT recursos_asignados_asignado_por_fkey
  FOREIGN KEY (asignado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.resumenes_ia DROP CONSTRAINT resumenes_ia_generado_por_fkey,
  ADD CONSTRAINT resumenes_ia_generado_por_fkey
  FOREIGN KEY (generado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sesion_notas DROP CONSTRAINT sesion_notas_autor_id_fkey,
  ADD CONSTRAINT sesion_notas_autor_id_fkey
  FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tarea_respuestas DROP CONSTRAINT tarea_respuestas_retroalimentacion_por_fkey,
  ADD CONSTRAINT tarea_respuestas_retroalimentacion_por_fkey
  FOREIGN KEY (retroalimentacion_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tareas DROP CONSTRAINT tareas_asignada_por_fkey,
  ADD CONSTRAINT tareas_asignada_por_fkey
  FOREIGN KEY (asignada_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.terapeutas DROP CONSTRAINT terapeutas_verificado_por_fkey,
  ADD CONSTRAINT terapeutas_verificado_por_fkey
  FOREIGN KEY (verificado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.transferencias DROP CONSTRAINT transferencias_terapeuta_origen_fkey,
  ADD CONSTRAINT transferencias_terapeuta_origen_fkey
  FOREIGN KEY (terapeuta_origen) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.transferencias DROP CONSTRAINT transferencias_terapeuta_destino_fkey,
  ADD CONSTRAINT transferencias_terapeuta_destino_fkey
  FOREIGN KEY (terapeuta_destino) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMIT;
