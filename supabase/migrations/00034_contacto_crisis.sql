-- =============================================================================
-- NOEMA · 00034 · Contacto de crisis del terapeuta (#10)
-- =============================================================================
-- Para que el paciente pueda contactar a su terapeuta en crisis (llamada o
-- videollamada), el terapeuta define estos datos en la vinculación. El mensaje
-- siempre funciona (no requiere config).
-- =============================================================================

alter table public.vinculaciones
  add column if not exists telefono_terapeuta   text,
  add column if not exists video_crisis_url     text;

comment on column public.vinculaciones.telefono_terapeuta is
  'Teléfono que el paciente puede llamar en crisis (lo define el terapeuta).';
comment on column public.vinculaciones.video_crisis_url is
  'Link de videollamada para crisis (lo define el terapeuta).';

-- Demo: dar a la vinculación de María datos de contacto de ejemplo.
update public.vinculaciones
set telefono_terapeuta = '55 1234 5678',
    video_crisis_url = 'https://meet.google.com/abc-defg-hij'
where codigo_invitacion = 'NOEMA-D23Y';
