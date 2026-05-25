-- =============================================================================
-- NOEMA — Datos semilla para desarrollo local
-- =============================================================================
-- Corre automáticamente con `supabase db reset`.
-- Incluye:
--   - 5 familias emocionales con sus emociones específicas
--   - Categorías de contenido educativo
--   - Recursos de emergencia (MX prioritario, otros países básicos)
--   - Plantillas oficiales de ejercicios (NOEMA-curadas)
-- =============================================================================

-- =============================================================================
-- EMOCIONES (BIBLIA §3 — 5 acentos cromáticos)
-- =============================================================================

insert into public.emociones_catalogo (key, familia, nombre_es, descripcion, orden) values
  -- Tranquilo (#C7D2BD)
  ('tranquilo',    'tranquilo', 'Tranquilo',    'Estado de calma general.', 10),
  ('en_paz',       'tranquilo', 'En paz',       'Sin agitación, presente.', 11),
  ('agradecido',   'tranquilo', 'Agradecido',   'Reconozco algo bueno hoy.', 12),
  ('descansado',   'tranquilo', 'Descansado',   'Cuerpo y mente con energía.', 13),
  ('en_equilibrio','tranquilo', 'En equilibrio','Sin extremos, estable.', 14),

  -- Ansioso (#F0C9AE)
  ('ansioso',      'ansioso',   'Ansioso',      'Inquietud anticipatoria.', 20),
  ('preocupado',   'ansioso',   'Preocupado',   'Mente dando vueltas a algo.', 21),
  ('alerta',       'ansioso',   'En alerta',    'Hipervigilante, tenso.', 22),
  ('inquieto',     'ansioso',   'Inquieto',     'Cuesta quedarme quieto.', 23),
  ('abrumado',     'ansioso',   'Abrumado',     'Demasiado al mismo tiempo.', 24),

  -- Triste (#E8B5AB)
  ('triste',       'triste',    'Triste',       'Una tristeza presente.', 30),
  ('melancolico',  'triste',    'Melancólico',  'Algo nostálgico, sin causa exacta.', 31),
  ('solo',         'triste',    'Solo',         'Sensación de soledad.', 32),
  ('vacio',        'triste',    'Vacío',        'Sin ganas claras de nada.', 33),
  ('en_duelo',     'triste',    'En duelo',     'Procesando una pérdida.', 34),

  -- Cansado (#D9B98C)
  ('cansado',      'cansado',   'Cansado',      'Energía baja.', 40),
  ('agotado',      'cansado',   'Agotado',      'Sin fuerzas reales.', 41),
  ('con_sueno',    'cansado',   'Con sueño',    'Necesito dormir.', 42),
  ('sobrecargado', 'cansado',   'Sobrecargado', 'Más responsabilidades de las que puedo.', 43),
  ('apagado',      'cansado',   'Apagado',      'Sin chispa, en automático.', 44),

  -- Feliz (#B9C9CC)
  ('feliz',        'feliz',     'Feliz',        'Bienestar claro.', 50),
  ('satisfecho',   'feliz',     'Satisfecho',   'Algo salió bien.', 51),
  ('entusiasmado', 'feliz',     'Entusiasmado', 'Con ilusión por algo.', 52),
  ('conectado',    'feliz',     'Conectado',    'Cerca de alguien o de mí mismo.', 53),
  ('orgulloso',    'feliz',     'Orgulloso',    'Reconozco un logro propio.', 54)
on conflict (key) do nothing;

-- =============================================================================
-- CATEGORÍAS DE CONTENIDO EDUCATIVO
-- =============================================================================

insert into public.categorias (key, nombre, descripcion, icono, orden) values
  ('ansiedad',         'Ansiedad',         'Herramientas para entender y acompañar la ansiedad.', 'wave', 10),
  ('estres',           'Estrés',           'Manejo del estrés cotidiano y crónico.', 'pulse', 20),
  ('autoestima',       'Autoestima',       'Relación con uno mismo.', 'leaf', 30),
  ('relaciones',       'Relaciones',       'Vínculos, comunicación y límites.', 'circles', 40),
  ('duelo',            'Duelo',            'Acompañar las pérdidas.', 'moon', 50),
  ('habitos',          'Hábitos',          'Construir rutinas que sostienen.', 'sprout', 60),
  ('limites',          'Límites',          'Cuidar lo propio sin culpa.', 'boundary', 70),
  ('comunicacion',     'Comunicación',     'Decir lo que importa, escuchar bien.', 'speech', 80),
  ('crianza',          'Crianza',          'Acompañar a otros sin perderse.', 'hand', 90),
  ('pareja',           'Pareja',           'Vida en común.', 'rings', 100),
  ('trabajo',          'Trabajo',          'Salud emocional en el contexto laboral.', 'briefcase', 110),
  ('motivacion',       'Motivación',       'Cuando cuesta empezar.', 'spark', 120),
  ('autoconocimiento', 'Autoconocimiento', 'Saber quién soy.', 'mirror', 130),
  ('manejo_emocional', 'Manejo emocional', 'Regular sin reprimir.', 'breath', 140),
  ('primera_terapia',  'Primera vez en terapia', 'Cómo empezar un proceso.', 'open-door', 150)
on conflict (key) do nothing;

-- =============================================================================
-- RECURSOS DE EMERGENCIA — MÉXICO (mercado primario)
-- =============================================================================

insert into public.recursos_emergencia (pais, ciudad, tipo, nombre, telefono, descripcion, horario, url, orden) values
  ('MX', null, 'emergencias_generales', 'Emergencias 911', '911', 'Servicio de emergencia nacional.', '24/7', null, 10),
  ('MX', null, 'linea_crisis', 'SAPTEL — Salud Mental y Crisis', '5552598121',
   'Servicio de atención psicológica por teléfono. Asociación civil. Atención profesional gratuita y confidencial.',
   '24/7', 'https://www.saptel.org.mx', 20),
  ('MX', null, 'linea_crisis', 'Línea de la Vida', '8002901010',
   'Atención en crisis emocionales y prevención del suicidio. CONADIC.',
   '24/7', 'https://www.gob.mx/salud/conadic', 30),
  ('MX', null, 'linea_crisis', 'Locatel CDMX — Apoyo emocional', '5556581111',
   'Atención psicológica gratuita por teléfono en CDMX.',
   '24/7', 'https://www.locatel.cdmx.gob.mx', 40),
  ('MX', null, 'violencia', 'Línea Mujeres CDMX', '5556581111',
   'Atención a mujeres víctimas de violencia.',
   '24/7', null, 50),
  ('MX', null, 'violencia', 'Vida sin Violencia', '8008822256',
   'Línea nacional contra la violencia hacia las mujeres.',
   '24/7', null, 60),
  ('MX', 'CDMX', 'salud_mental', 'UNAM — Atención Psicológica', '5550255555',
   'Centro de servicios psicológicos UNAM.',
   'L-V 9-18', 'https://psicologia.unam.mx', 70)
on conflict do nothing;

-- =============================================================================
-- RECURSOS DE EMERGENCIA — OTROS PAÍSES (básicos)
-- =============================================================================

insert into public.recursos_emergencia (pais, ciudad, tipo, nombre, telefono, descripcion, horario, orden) values
  ('AR', null, 'emergencias_generales', 'Emergencias 911', '911', 'Servicio de emergencia.', '24/7', 10),
  ('AR', null, 'linea_crisis', 'Centro de Asistencia al Suicida', '135',
   'Línea gratuita de prevención del suicidio (Argentina).', '24/7', 20),
  ('CO', null, 'emergencias_generales', 'Línea de Emergencias 123', '123', 'Emergencias.', '24/7', 10),
  ('CO', null, 'linea_crisis', 'Línea de la Vida Bogotá', '6013811616',
   'Atención psicológica en crisis.', '24/7', 20),
  ('ES', null, 'emergencias_generales', 'Emergencias 112', '112', 'Emergencias.', '24/7', 10),
  ('ES', null, 'linea_crisis', 'Teléfono de la Esperanza', '717003717',
   'Apoyo emocional y prevención del suicidio.', '24/7', 20),
  ('US', null, 'emergencias_generales', 'Emergencies 911', '911', 'Emergency services.', '24/7', 10),
  ('US', null, 'linea_crisis', '988 Suicide & Crisis Lifeline', '988',
   'Free, confidential support 24/7.', '24/7', 20)
on conflict do nothing;

-- =============================================================================
-- PLANTILLAS OFICIALES NOEMA (terapeuta_id = null)
-- =============================================================================

insert into public.plantillas_ejercicios
  (id, terapeuta_id, titulo, descripcion, categoria, contenido_md, duracion_min, tipo, campos_respuesta, publica)
values
  (
    gen_random_uuid(), null,
    'Respiración consciente — 5 minutos',
    'Un ejercicio breve para ayudarte a centrarte y reducir la ansiedad.',
    'ansiedad',
    E'## Instrucciones\n\n1. Encuentra un lugar tranquilo y siéntate cómodamente.\n2. Cierra los ojos si lo prefieres.\n3. Inhala despacio por la nariz, contando hasta 4.\n4. Sostén el aire, contando hasta 4.\n5. Exhala suavemente por la boca, contando hasta 6.\n6. Repite durante 5 minutos.\n\nCuando termines, observa cómo te sientes — sin juzgarlo.',
    5, 'ejercicio',
    '[{"key":"sensacion_post","label":"¿Cómo te sientes ahora?","type":"text"},{"key":"facilidad","label":"¿Qué tan fácil te resultó?","type":"scale","min":1,"max":5}]'::jsonb,
    true
  ),
  (
    gen_random_uuid(), null,
    'Diario de pensamientos',
    'Identifica un pensamiento que te incomodó hoy y obsérvalo desde otra perspectiva.',
    'manejo_emocional',
    E'## Instrucciones\n\nElige un momento del día en el que sentiste una emoción intensa.\n\n1. **Situación**: ¿qué estaba pasando?\n2. **Pensamiento**: ¿qué cruzó por tu cabeza?\n3. **Emoción**: ¿qué sentiste (y con qué intensidad)?\n4. **Otra forma de mirarlo**: ¿hay otra manera posible de leer esa situación?\n\nNo busques que la emoción cambie. Solo observa.',
    10, 'ejercicio',
    '[{"key":"situacion","label":"Situación","type":"text"},{"key":"pensamiento","label":"Pensamiento","type":"text"},{"key":"emocion","label":"Emoción","type":"text"},{"key":"alternativa","label":"Otra forma de mirarlo","type":"text"}]'::jsonb,
    true
  ),
  (
    gen_random_uuid(), null,
    'Práctica de gratitud — 3 cosas',
    'Antes de dormir, escribe tres cosas por las que te sentiste agradecido hoy.',
    'autoestima',
    E'## Instrucciones\n\nAl final del día, escribe tres cosas, grandes o pequeñas, por las que te sentiste agradecido.\n\nPuede ser una conversación, un momento de descanso, un café, una luz, lo que sea.\n\nNo es para "pensar en positivo". Es para entrenar la atención en lo que ya está bien.',
    5, 'ejercicio',
    '[{"key":"agradecido_1","label":"Primera cosa","type":"text"},{"key":"agradecido_2","label":"Segunda cosa","type":"text"},{"key":"agradecido_3","label":"Tercera cosa","type":"text"}]'::jsonb,
    true
  ),
  (
    gen_random_uuid(), null,
    'Registro de detonantes de ansiedad',
    'Identifica qué situaciones disparan la ansiedad en tu semana.',
    'ansiedad',
    E'## Instrucciones\n\nDurante una semana, cada vez que aparezca ansiedad, anota:\n\n- Hora y lugar\n- Qué estaba pasando justo antes\n- Qué pensamientos surgieron\n- Qué sensaciones físicas notaste\n- Qué hiciste\n\nNo busques cambiar nada todavía. Solo registra. Al final de la semana, revisa con tu terapeuta los patrones.',
    null, 'ejercicio',
    '[{"key":"hora","label":"Hora","type":"time"},{"key":"contexto","label":"Qué estaba pasando","type":"text"},{"key":"intensidad","label":"Intensidad","type":"scale","min":1,"max":5}]'::jsonb,
    true
  ),
  (
    gen_random_uuid(), null,
    'Seguimiento del sueño',
    'Llevar un registro de la calidad de tu descanso ayuda a identificar patrones.',
    'habitos',
    E'## Instrucciones\n\nCada mañana al despertar, anota brevemente:\n\n- Hora de dormir\n- Hora de despertar\n- Calidad percibida del sueño (1-5)\n- Si tuviste despertares nocturnos\n- Cómo te sientes al despertar\n\nMantenlo simple. Si un día se te pasa, no pasa nada.',
    2, 'ejercicio',
    '[{"key":"hora_dormir","label":"Hora de dormir","type":"time"},{"key":"hora_despertar","label":"Hora de despertar","type":"time"},{"key":"calidad","label":"Calidad del sueño","type":"scale","min":1,"max":5},{"key":"sensacion","label":"Cómo te sientes al despertar","type":"text"}]'::jsonb,
    true
  )
on conflict do nothing;
