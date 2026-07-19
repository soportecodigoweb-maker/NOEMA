-- =============================================================================
-- NOEMA · 00029 · Seed del catálogo de emociones (FALTABA EN CLOUD)
-- =============================================================================
-- BUG: emociones_catalogo se sembraba solo en supabase/seed.sql, que `db push`
-- NO ejecuta. Sin este catálogo, registros_emocionales falla por FK y los
-- pacientes NO pueden registrar emociones. Lo movemos a migration para que
-- viaje con el schema.
-- =============================================================================

insert into public.emociones_catalogo (key, familia, nombre_es, descripcion, orden) values
  ('tranquilo',    'tranquilo', 'Tranquilo',    'Estado de calma general.', 10),
  ('en_paz',       'tranquilo', 'En paz',       'Sin agitación, presente.', 11),
  ('agradecido',   'tranquilo', 'Agradecido',   'Reconozco algo bueno hoy.', 12),
  ('descansado',   'tranquilo', 'Descansado',   'Cuerpo y mente con energía.', 13),
  ('en_equilibrio','tranquilo', 'En equilibrio','Sin extremos, estable.', 14),
  ('ansioso',      'ansioso',   'Ansioso',      'Inquietud anticipatoria.', 20),
  ('preocupado',   'ansioso',   'Preocupado',   'Mente dando vueltas a algo.', 21),
  ('alerta',       'ansioso',   'En alerta',    'Hipervigilante, tenso.', 22),
  ('inquieto',     'ansioso',   'Inquieto',     'Cuesta quedarme quieto.', 23),
  ('abrumado',     'ansioso',   'Abrumado',     'Demasiado al mismo tiempo.', 24),
  ('triste',       'triste',    'Triste',       'Una tristeza presente.', 30),
  ('melancolico',  'triste',    'Melancólico',  'Algo nostálgico, sin causa exacta.', 31),
  ('solo',         'triste',    'Solo',         'Sensación de soledad.', 32),
  ('vacio',        'triste',    'Vacío',        'Sin ganas claras de nada.', 33),
  ('en_duelo',     'triste',    'En duelo',     'Procesando una pérdida.', 34),
  ('cansado',      'cansado',   'Cansado',      'Energía baja.', 40),
  ('agotado',      'cansado',   'Agotado',      'Sin fuerzas reales.', 41),
  ('con_sueno',    'cansado',   'Con sueño',    'Necesito dormir.', 42),
  ('sobrecargado', 'cansado',   'Sobrecargado', 'Más responsabilidades de las que puedo.', 43),
  ('apagado',      'cansado',   'Apagado',      'Sin chispa, en automático.', 44),
  ('feliz',        'feliz',     'Feliz',        'Bienestar claro.', 50),
  ('satisfecho',   'feliz',     'Satisfecho',   'Algo salió bien.', 51),
  ('entusiasmado', 'feliz',     'Entusiasmado', 'Con ilusión por algo.', 52),
  ('conectado',    'feliz',     'Conectado',    'Cerca de alguien o de mí mismo.', 53),
  ('orgulloso',    'feliz',     'Orgulloso',    'Reconozco un logro propio.', 54)
on conflict (key) do nothing;
