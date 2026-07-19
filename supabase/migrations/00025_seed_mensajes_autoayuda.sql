-- =============================================================================
-- NOEMA · 00025 · Corpus inicial de mensajes de autoayuda (paciente #1)
-- =============================================================================
-- Mensajes FUNCIONALES basados en marcos con evidencia (TCC, ACT, DBT,
-- Activación Conductual, Mindfulness, autocompasión). Cada uno tiene una acción
-- concreta, no es una frase motivacional vacía.
--
-- ⚠️ BORRADOR CLÍNICO: publicado=false. Un profesional de salud mental debe
-- validar, ajustar el tono y AMPLIAR este corpus antes de enviarlo a pacientes.
-- Este es un punto de partida estructurado, NO un corpus exhaustivo.
--
-- Idempotente: sólo inserta si la tabla está vacía (evita duplicar al re-correr).
-- =============================================================================

do $$
begin
  if exists (select 1 from public.mensajes_autoayuda limit 1) then
    return; -- ya sembrado
  end if;

  insert into public.mensajes_autoayuda (texto, objetivo, enfoque, contexto, accion, riesgo_maximo) values

  -- ===== ANSIEDAD =====
  ('Una emoción intensa no es una emergencia. La ansiedad sube, llega a un pico y baja sola. Puedes acompañarla sin pelear.',
   'ansiedad', 'act', 'post_registro_malestar',
   'Respira 4-7-8 tres veces y observa cómo cambia la intensidad.', 'medio'),
  ('Cuando la mente se acelera, tus sentidos te anclan al presente. No tienes que resolver todo ahora mismo.',
   'ansiedad', 'mindfulness', 'post_registro_malestar',
   'Nombra 5 cosas que ves, 4 que puedes tocar, 3 que escuchas.', 'medio'),
  ('Preguntarte "¿qué tan probable es realmente?" no elimina el miedo, pero le quita el megáfono a los pensamientos catastróficos.',
   'ansiedad', 'tcc', 'general',
   'Anota el pensamiento y busca una evidencia a favor y una en contra.', 'medio'),
  ('Evitar lo que te da ansiedad calma por un rato, pero la hace más grande a la larga. Acercarte de a poco es cómo pierde fuerza.',
   'ansiedad', 'tcc', 'general',
   'Elige un paso pequeño hacia algo que has estado evitando.', 'bajo'),
  ('Empezar el día con una respiración lenta le avisa a tu cuerpo que hoy puede ir a otro ritmo.',
   'ansiedad', 'mindfulness', 'manana',
   'Antes de levantarte, haz 5 respiraciones largas.', 'medio'),

  -- ===== DEPRESIÓN / ACTIVACIÓN CONDUCTUAL =====
  ('En días difíciles, las ganas llegan DESPUÉS de actuar, no antes. Un paso pequeño cuenta como avance.',
   'depresion', 'activacion_conductual', 'manana',
   'Elige una sola actividad pequeña para hoy, aunque no tengas ganas.', 'medio'),
  ('Hacer menos cuando te sientes mal es natural, pero alimenta el círculo. Reactivar algo agradable, aunque sea mínimo, lo interrumpe.',
   'depresion', 'activacion_conductual', 'general',
   'Recuerda una actividad que antes disfrutabas y hazla 5 minutos.', 'medio'),
  ('No tienes que sentirte "bien" para hacer algo bueno por ti. Los momentos de agrado se construyen, no se esperan.',
   'depresion', 'activacion_conductual', 'general',
   'Programa un momento agradable pequeño para hoy o mañana.', 'medio'),
  ('La voz que te dice "no sirve de nada" es un síntoma, no una verdad. Puedes escucharla sin obedecerla.',
   'depresion', 'act', 'post_registro_malestar',
   'Dale las gracias a esa voz y da un paso hacia lo que te importa.', 'medio'),
  ('Terminar el día reconociendo una sola cosa que hiciste —por pequeña que sea— reentrena a tu mente a ver también lo que sí.',
   'depresion', 'tcc', 'noche',
   'Anota una cosa que lograste hoy, aunque parezca insignificante.', 'medio'),

  -- ===== AUTOESTIMA / AUTOCOMPASIÓN =====
  ('Háblate como le hablarías a alguien que quieres. Nadie florece bajo crítica constante, tampoco tú.',
   'autoestima', 'autocompasion', 'post_registro_malestar',
   'Reescribe tu último pensamiento duro como se lo dirías a un buen amigo.', 'medio'),
  ('Cometer un error no te define. Es información para aprender, no una sentencia sobre tu valor.',
   'autoestima', 'tcc', 'general',
   'Separa el hecho ("me equivoqué") del juicio ("soy un fracaso").', 'medio'),
  ('El sufrimiento es parte de ser humano, no una señal de que algo está mal en ti. No estás sola/o en esto.',
   'autoestima', 'autocompasion', 'general',
   'Pon una mano en tu pecho y date un momento de amabilidad.', 'medio'),

  -- ===== RELACIONES =====
  ('Poner un límite no te hace mala persona. Cuidar tu espacio también es cuidar la relación.',
   'relaciones', 'dbt', 'general',
   'Piensa en un límite pequeño que quieras comunicar esta semana.', 'medio'),
  ('Puedes validar lo que sientes Y cuidar cómo lo expresas. Ambas cosas caben.',
   'relaciones', 'dbt', 'post_registro_malestar',
   'Antes de responder molesto, respira y elige tus palabras.', 'medio'),

  -- ===== ESTRÉS =====
  ('El descanso no es un premio que se gana; es una necesidad. Tu cuerpo también pide pausas.',
   'estres', 'mindfulness', 'general',
   'Toma una pausa de 2 minutos ahora: solo respira, sin pantalla.', 'medio'),
  ('No puedes con todo a la vez, y no tienes que hacerlo. Una cosa, luego la siguiente.',
   'estres', 'tcc', 'manana',
   'Elige la única tarea más importante de hoy y empieza por ahí.', 'medio'),

  -- ===== SUEÑO =====
  ('Tu mente necesita una señal de que el día terminó. Bajar las luces y las pantallas ayuda a que el cuerpo lo entienda.',
   'sueno', 'tcc', 'noche',
   'Apaga pantallas 30 min antes de dormir y baja la intensidad de la luz.', 'medio'),
  ('Si no logras dormir, dar vueltas frustrado no ayuda. Levantarte a hacer algo tranquilo y volver cuando tengas sueño sí.',
   'sueno', 'tcc', 'noche',
   'Si llevas 20 min despierto, sal de la cama y haz algo calmado.', 'medio'),

  -- ===== REGULACIÓN EMOCIONAL (DBT) =====
  ('Las emociones son información, no órdenes. Puedes sentir algo intenso sin actuar de inmediato.',
   'regulacion_emocional', 'dbt', 'post_registro_malestar',
   'Nombra la emoción en voz alta: "estoy sintiendo ___". Solo eso.', 'medio'),
  ('Cuando la emoción está en su punto más alto, mojarte la cara con agua fría o mover el cuerpo ayuda a bajar la intensidad.',
   'regulacion_emocional', 'dbt', 'post_registro_malestar',
   'Prueba agua fría en la cara o camina rápido 3 minutos.', 'medio'),
  ('Observar una emoción es distinto a ahogarte en ella. Puedes verla pasar como una ola.',
   'regulacion_emocional', 'mindfulness', 'general',
   'Imagina la emoción como una ola: obsérvala subir y bajar sin luchar.', 'medio'),

  -- ===== GENERAL =====
  ('Registrar cómo te sientes no cambia el día, pero te ayuda a conocerte. Con el tiempo, los patrones se vuelven visibles.',
   'general', 'tcc', 'general',
   'Abre NOEMA y registra cómo te sientes ahora mismo.', 'medio'),
  ('Los avances no son lineales. Un día difícil no borra lo que has construido.',
   'general', 'autocompasion', 'general',
   'Recuerda un momento reciente en que sí pudiste. Ese también eres tú.', 'medio'),
  ('Hoy solo tienes que ocuparte de hoy. El resto puede esperar su turno.',
   'general', 'act', 'manana',
   'Define una intención sencilla para el día de hoy.', 'medio'),
  ('Tu proceso continúa aunque no lo sientas. Aparecer, aunque sea un poco, ya es parte del trabajo.',
   'general', 'act', 'post_inactividad',
   'Vuelve a NOEMA con un registro breve. No necesitas más hoy.', 'medio'),
  ('Antes de tu sesión, reunir lo que te ha movido estos días le da más a tu terapeuta con quién trabajar.',
   'general', 'tcc', 'previo_sesion',
   'Marca en tu diario lo que quieres hablar en la próxima sesión.', 'medio');

end $$;
