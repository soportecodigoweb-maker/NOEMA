-- =============================================================================
-- NOEMA · 00022 · Seed de plantillas terapéuticas oficiales (requerimiento #3)
-- =============================================================================
-- Plantillas oficiales NOEMA (terapeuta_id = null). El terapeuta puede
-- DUPLICARLAS y adaptarlas para cada paciente.
--
-- ⚠️ CONTENIDO BORRADOR: los textos clínicos son borradores informados en
-- técnicas estándar (TCC/ACT/mindfulness) de bajo riesgo. DEBEN ser revisados
-- y validados por un profesional de salud mental antes de mostrarse a
-- pacientes reales. Por eso NO se publican automáticamente (los ejercicios
-- se pueden asignar, pero la psicoeducación queda publicado=false).
--
-- Idempotente: usa claves estables en titulo para evitar duplicados al re-correr.
-- =============================================================================

-- Helper de idempotencia: sólo inserta si no existe una plantilla oficial
-- (terapeuta_id null) con ese título.
do $$
declare
  v_existe boolean;
begin

  -- =========================================================================
  -- 1. AUTO-REGISTRO TERAPÉUTICO (situación → emoción → pensamiento → conducta)
  -- =========================================================================
  select exists(select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Auto-registro: situación, emoción y pensamiento') into v_existe;
  if not v_existe then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, campos_respuesta, duracion_min, publica)
    values (
      null,
      'Auto-registro: situación, emoción y pensamiento',
      'Registro estructurado para identificar la relación entre lo que pasa, lo que sientes y lo que piensas. Base del trabajo cognitivo-conductual.',
      'auto_registro', 'ejercicio',
      $md$Cuando notes una emoción intensa, tómate un momento para registrar lo que ocurrió. No hay respuestas correctas ni incorrectas: es información para entenderte mejor.

**1. Situación** — ¿Qué estaba pasando? ¿Dónde estabas, con quién, qué hacías?

**2. Emoción** — ¿Qué emoción apareció? ¿Qué tan intensa fue del 1 al 10?

**3. Pensamiento** — ¿Qué pasó por tu mente en ese momento? ¿Qué te dijiste a ti misma/o?

**4. Conducta** — ¿Qué hiciste? ¿Cómo reaccionaste?

Registrar sin juzgarte es el primer paso. Con el tiempo, notarás patrones que podrás trabajar en sesión.$md$,
      $json$[
        {"key":"situacion","label":"¿Qué estaba pasando?","type":"text","required":true},
        {"key":"emocion","label":"¿Qué emoción sentiste?","type":"text","required":true},
        {"key":"intensidad","label":"Intensidad (1-10)","type":"scale","min":1,"max":10},
        {"key":"pensamiento","label":"¿Qué pensaste?","type":"text"},
        {"key":"conducta","label":"¿Qué hiciste?","type":"text"}
      ]$json$::jsonb,
      10, true
    );
  end if;

  -- =========================================================================
  -- 2. REGISTRO DE PENSAMIENTOS AUTOMÁTICOS (TCC)
  -- =========================================================================
  select exists(select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Registro de pensamientos automáticos') into v_existe;
  if not v_existe then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, campos_respuesta, duracion_min, publica)
    values (
      null,
      'Registro de pensamientos automáticos',
      'Identifica pensamientos automáticos, evalúa su evidencia y construye una alternativa más equilibrada. Herramienta central de la Terapia Cognitivo-Conductual.',
      'pensamientos_automaticos', 'ejercicio',
      $md$Los pensamientos automáticos aparecen rápido y solemos creerlos sin cuestionarlos. Este ejercicio te ayuda a examinarlos con calma.

**Pensamiento automático** — ¿Qué idea apareció automáticamente? (Ej. "Voy a fracasar", "No le importo a nadie")

**¿Qué tanto lo creo?** — Del 0 al 100%.

**Evidencia a favor** — ¿Qué hechos apoyan ese pensamiento?

**Evidencia en contra** — ¿Qué hechos lo contradicen? ¿Qué le dirías a alguien que quieres si pensara eso?

**Pensamiento alternativo** — Una versión más justa y equilibrada, considerando toda la evidencia.

**¿Cómo me siento ahora?** — Vuelve a medir la intensidad de tu emoción.

Con la práctica, cuestionar pensamientos se vuelve más natural.$md$,
      $json$[
        {"key":"pensamiento","label":"Pensamiento automático","type":"text","required":true},
        {"key":"credibilidad","label":"¿Qué tanto lo creo? (0-100%)","type":"scale","min":0,"max":100},
        {"key":"evidencia_favor","label":"Evidencia a favor","type":"text"},
        {"key":"evidencia_contra","label":"Evidencia en contra","type":"text"},
        {"key":"alternativa","label":"Pensamiento alternativo","type":"text"},
        {"key":"emocion_despues","label":"¿Cómo me siento ahora? (1-10)","type":"scale","min":1,"max":10}
      ]$json$::jsonb,
      15, true
    );
  end if;

  -- =========================================================================
  -- 3. HOJA EN BLANCO (escritura libre del paciente)
  -- =========================================================================
  select exists(select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Hoja en blanco: escribe libremente') into v_existe;
  if not v_existe then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, campos_respuesta, duracion_min, publica)
    values (
      null,
      'Hoja en blanco: escribe libremente',
      'Un espacio abierto para que el paciente escriba lo que necesite: reflexiones, cartas no enviadas, preguntas para la sesión, planes.',
      'escritura_libre', 'ejercicio',
      $md$Este es tu espacio. Escribe lo que quieras, como quieras.

Algunas ideas por si no sabes cómo empezar:
- Algo que te está dando vueltas y no has podido decir en voz alta.
- Una carta que nunca enviarías (a alguien, o a ti misma/o).
- Preguntas que quieres llevar a tu próxima sesión.
- Un plan o una decisión que estás considerando.

No te preocupes por la ortografía ni por que tenga sentido. Escribir para ti ya es suficiente.$md$,
      $json$[]$json$::jsonb,
      15, true
    );
  end if;

  -- =========================================================================
  -- 4. RESPIRACIÓN DIAFRAGMÁTICA (4-7-8)
  -- =========================================================================
  select exists(select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Respiración 4-7-8 para calmar el cuerpo') into v_existe;
  if not v_existe then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, campos_respuesta, duracion_min, publica)
    values (
      null,
      'Respiración 4-7-8 para calmar el cuerpo',
      'Ejercicio breve de respiración para regular la activación fisiológica en momentos de ansiedad o estrés.',
      'relajacion', 'ejercicio',
      $md$La respiración lenta le avisa a tu cuerpo que puede bajar la guardia. Busca un lugar tranquilo y siéntate cómoda/o.

**El ciclo 4-7-8:**
1. Inhala por la nariz contando hasta **4**.
2. Retén el aire contando hasta **7**.
3. Exhala lentamente por la boca contando hasta **8**, como soplando por un popote.

Repite el ciclo **4 veces**. Si te mareas, acorta las cuentas y respira normal un momento.

**Después del ejercicio**, nota: ¿cambió algo en tu cuerpo? ¿En tu mente? No busques sentirte "perfectamente bien", solo observa si hubo algún cambio, por pequeño que sea.$md$,
      $json$[
        {"key":"antes","label":"Nivel de tensión ANTES (1-10)","type":"scale","min":1,"max":10},
        {"key":"despues","label":"Nivel de tensión DESPUÉS (1-10)","type":"scale","min":1,"max":10}
      ]$json$::jsonb,
      5, true
    );
  end if;

  -- =========================================================================
  -- 5. RELAJACIÓN MUSCULAR PROGRESIVA (Jacobson)
  -- =========================================================================
  select exists(select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Relajación muscular progresiva') into v_existe;
  if not v_existe then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, campos_respuesta, duracion_min, publica)
    values (
      null,
      'Relajación muscular progresiva',
      'Técnica de Jacobson: tensar y relajar grupos musculares para reconocer y soltar la tensión corporal.',
      'relajacion', 'ejercicio',
      $md$Este ejercicio te ayuda a diferenciar entre tensión y relajación. Recuéstate o siéntate cómoda/o, en un lugar donde no te interrumpan por unos 10 minutos.

La idea es sencilla: **tensa** cada grupo muscular unos 5 segundos, luego **suelta** de golpe y nota la diferencia durante 10 segundos.

Recorre tu cuerpo en este orden:
1. **Manos y antebrazos** — cierra los puños.
2. **Brazos** — lleva los puños a los hombros.
3. **Cara** — aprieta los ojos y frunce todo el rostro.
4. **Cuello y hombros** — sube los hombros hacia las orejas.
5. **Pecho y espalda** — inhala profundo y arquea ligeramente.
6. **Abdomen** — tensa como si fueras a recibir un golpe suave.
7. **Piernas** — estira y apunta los pies.

Al terminar, quédate un momento notando la sensación de tu cuerpo relajado. No hay prisa.$md$,
      $json$[
        {"key":"antes","label":"Tensión corporal ANTES (1-10)","type":"scale","min":1,"max":10},
        {"key":"despues","label":"Tensión corporal DESPUÉS (1-10)","type":"scale","min":1,"max":10},
        {"key":"notas","label":"¿Qué zona tenía más tensión?","type":"text"}
      ]$json$::jsonb,
      12, true
    );
  end if;

  -- =========================================================================
  -- 6. MINDFULNESS / ATENCIÓN PLENA (anclaje en el presente)
  -- =========================================================================
  select exists(select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Atención plena: anclaje 5-4-3-2-1') into v_existe;
  if not v_existe then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, campos_respuesta, duracion_min, publica)
    values (
      null,
      'Atención plena: anclaje 5-4-3-2-1',
      'Ejercicio de mindfulness para volver al presente usando los sentidos. Útil cuando la mente se va a preocupaciones o rumiación.',
      'mindfulness', 'ejercicio',
      $md$Cuando tu mente esté acelerada o en el pasado/futuro, este ejercicio te ancla al aquí y ahora a través de tus sentidos.

Respira una vez, despacio, y observa a tu alrededor:

- **5 cosas que puedes VER** — mira los detalles, los colores, las formas.
- **4 cosas que puedes TOCAR** — la textura de tu ropa, la temperatura del aire.
- **3 cosas que puedes ESCUCHAR** — sonidos cercanos y lejanos.
- **2 cosas que puedes OLER** — o dos olores que te gusten si no percibes ninguno.
- **1 cosa que puedes SABOREAR** — o algo que te gustaría saborear.

No se trata de "relajarte a la fuerza", sino de traer tu atención al presente. Puedes repetirlo las veces que necesites.$md$,
      $json$[
        {"key":"antes","label":"Qué tan presente me sentía ANTES (1-10)","type":"scale","min":1,"max":10},
        {"key":"despues","label":"Qué tan presente me siento DESPUÉS (1-10)","type":"scale","min":1,"max":10}
      ]$json$::jsonb,
      5, true
    );
  end if;

  -- =========================================================================
  -- 7. ESCANEO CORPORAL CON SEMÁFORO DE EMOCIONES
  -- =========================================================================
  select exists(select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Escaneo corporal con semáforo de emociones') into v_existe;
  if not v_existe then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, campos_respuesta, duracion_min, publica)
    values (
      null,
      'Escaneo corporal con semáforo de emociones',
      'Recorre tu cuerpo notando sensaciones y clasifica tu estado con un semáforo: verde (en calma), amarillo (alerta), rojo (sobrepasada/o).',
      'escaneo_corporal', 'ejercicio',
      $md$Nuestras emociones viven también en el cuerpo. Este ejercicio te ayuda a escucharlas antes de que crezcan.

**Parte 1 — Escaneo corporal**
Cierra los ojos si te sientes cómoda/o. Recorre tu cuerpo lentamente, de la cabeza a los pies, sin cambiar nada, solo notando:
- ¿Dónde sientes tensión? ¿Dónde sientes calma?
- ¿Hay alguna zona que pide atención? (pecho apretado, estómago revuelto, mandíbula tensa…)

**Parte 2 — El semáforo**
Según cómo te encuentras ahora, elige un color:
- 🟢 **Verde** — Estoy en calma, mi cuerpo está tranquilo.
- 🟡 **Amarillo** — Empiezo a sentir tensión o incomodidad. Es momento de cuidarme.
- 🔴 **Rojo** — Me siento sobrepasada/o. Necesito parar y buscar apoyo.

Reconocer tu color es un acto de autocuidado. Si estás en rojo, recuerda que puedes usar tus recursos de apoyo.$md$,
      $json$[
        {"key":"zona_tension","label":"¿Dónde sentiste más tensión?","type":"text"},
        {"key":"semaforo","label":"Tu color ahora","type":"choice","options":["Verde - en calma","Amarillo - alerta","Rojo - sobrepasada/o"]}
      ]$json$::jsonb,
      8, true
    );
  end if;

end $$;
