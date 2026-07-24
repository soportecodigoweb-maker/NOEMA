-- =============================================================================
-- NOEMA · 00050 · Regenerar plantillas de ejercicio como formularios (R5-6)
-- =============================================================================
-- Las plantillas de ejercicio tenían un contenido_md largo (las preguntas
-- escritas en prosa), por lo que se veían como "un solo texto". Aquí se dejan
-- como formularios tipo Google Forms: un intro breve + preguntas estructuradas
-- en campos_respuesta. Al final se propaga a las copias de cada terapeuta
-- (origen_plantilla_id) para que también queden como formularios editables.
-- Idempotente.
-- =============================================================================

-- Helper local: actualiza una plantilla oficial por título.
do $$
declare
  procedure_placeholder int;
begin
  -- 1. Auto-registro
  update public.plantillas_ejercicios set
    contenido_md = 'Cuando notes una emoción intensa, tómate un momento para registrar lo que ocurrió. No hay respuestas correctas: es información para entenderte mejor.',
    campos_respuesta = $json$[
      {"key":"p1","label":"¿Qué estaba pasando? (situación)","type":"text","required":true},
      {"key":"p2","label":"¿Qué emoción apareció?","type":"text","required":true},
      {"key":"p3","label":"¿Qué tan intensa fue?","type":"scale","min":1,"max":5,"required":true},
      {"key":"p4","label":"¿Qué pensaste en ese momento?","type":"text"},
      {"key":"p5","label":"¿Qué hiciste? (conducta)","type":"text"}
    ]$json$::jsonb
  where terapeuta_id is null and titulo = 'Auto-registro: situación, emoción y pensamiento';

  -- 2. Registro de pensamientos automáticos (TCC)
  update public.plantillas_ejercicios set
    contenido_md = 'Identifica un pensamiento automático que te generó malestar y examínalo con calma. Esto te ayuda a tomar distancia de los pensamientos.',
    campos_respuesta = $json$[
      {"key":"p1","label":"Situación que lo disparó","type":"text","required":true},
      {"key":"p2","label":"Pensamiento automático","type":"text","required":true},
      {"key":"p3","label":"Emoción que sentiste","type":"text"},
      {"key":"p4","label":"Intensidad de la emoción","type":"scale","min":1,"max":5},
      {"key":"p5","label":"¿Qué evidencia hay a favor y en contra de ese pensamiento?","type":"text"},
      {"key":"p6","label":"Un pensamiento más equilibrado sería…","type":"text"}
    ]$json$::jsonb
  where terapeuta_id is null and titulo = 'Registro de pensamientos automáticos';

  -- 3. Hoja en blanco (escritura libre)
  update public.plantillas_ejercicios set
    contenido_md = 'Un espacio libre para escribir lo que necesites, sin estructura.',
    campos_respuesta = $json$[
      {"key":"p1","label":"Escribe libremente","type":"text","required":true}
    ]$json$::jsonb
  where terapeuta_id is null and titulo = 'Hoja en blanco: escribe libremente';

  -- 4. Respiración 4-7-8
  update public.plantillas_ejercicios set
    contenido_md = 'Inhala por la nariz contando 4, sostén contando 7, exhala por la boca contando 8. Repite el ciclo 4 veces. Luego responde:',
    campos_respuesta = $json$[
      {"key":"p1","label":"Nivel de tensión ANTES del ejercicio","type":"scale","min":1,"max":5,"required":true},
      {"key":"p2","label":"Nivel de tensión DESPUÉS del ejercicio","type":"scale","min":1,"max":5,"required":true},
      {"key":"p3","label":"¿Cuántos ciclos completaste?","type":"choice","options":["1","2","3","4 o más"]},
      {"key":"p4","label":"¿Cómo te sentiste? (opcional)","type":"text"}
    ]$json$::jsonb
  where terapeuta_id is null and titulo = 'Respiración 4-7-8 para calmar el cuerpo';

  -- 5. Relajación muscular progresiva
  update public.plantillas_ejercicios set
    contenido_md = 'Tensa y relaja cada grupo muscular por unos segundos, de los pies a la cabeza, notando el contraste. Al terminar, responde:',
    campos_respuesta = $json$[
      {"key":"p1","label":"Tensión corporal ANTES","type":"scale","min":1,"max":5,"required":true},
      {"key":"p2","label":"Tensión corporal DESPUÉS","type":"scale","min":1,"max":5,"required":true},
      {"key":"p3","label":"¿Qué zona del cuerpo tenías más tensa?","type":"text"},
      {"key":"p4","label":"¿Lograste completar el recorrido?","type":"choice","options":["Sí, completo","A medias","Me costó"]}
    ]$json$::jsonb
  where terapeuta_id is null and titulo = 'Relajación muscular progresiva';

  -- 6. Atención plena 5-4-3-2-1
  update public.plantillas_ejercicios set
    contenido_md = 'Ancla tu atención al presente usando tus sentidos. Anota lo que notes en cada uno:',
    campos_respuesta = $json$[
      {"key":"p1","label":"5 cosas que puedes VER","type":"text","required":true},
      {"key":"p2","label":"4 cosas que puedes TOCAR","type":"text"},
      {"key":"p3","label":"3 cosas que puedes OÍR","type":"text"},
      {"key":"p4","label":"2 cosas que puedes OLER","type":"text"},
      {"key":"p5","label":"1 cosa que puedes SABOREAR","type":"text"},
      {"key":"p6","label":"¿Qué tan presente te sientes ahora?","type":"scale","min":1,"max":5}
    ]$json$::jsonb
  where terapeuta_id is null and titulo = 'Atención plena: anclaje 5-4-3-2-1';

  -- 7. Escaneo corporal con semáforo
  update public.plantillas_ejercicios set
    contenido_md = 'Recorre tu cuerpo con atención y márcale un color de semáforo a cómo se siente cada zona (verde: bien, amarillo: tensión, rojo: dolor/malestar).',
    campos_respuesta = $json$[
      {"key":"p1","label":"Cabeza y cuello","type":"choice","options":["Verde","Amarillo","Rojo"],"required":true},
      {"key":"p2","label":"Pecho y respiración","type":"choice","options":["Verde","Amarillo","Rojo"],"required":true},
      {"key":"p3","label":"Estómago","type":"choice","options":["Verde","Amarillo","Rojo"]},
      {"key":"p4","label":"Hombros y espalda","type":"choice","options":["Verde","Amarillo","Rojo"]},
      {"key":"p5","label":"¿Dónde sentiste más carga y qué crees que la causó?","type":"text"}
    ]$json$::jsonb
  where terapeuta_id is null and titulo = 'Escaneo corporal con semáforo de emociones';
end $$;

-- Propagar contenido + campos a las copias de cada terapeuta (siguen siendo
-- editables; esto solo las pone al día como formularios).
update public.plantillas_ejercicios p
set contenido_md = o.contenido_md,
    campos_respuesta = o.campos_respuesta
from public.plantillas_ejercicios o
where p.origen_plantilla_id = o.id
  and o.terapeuta_id is null;
