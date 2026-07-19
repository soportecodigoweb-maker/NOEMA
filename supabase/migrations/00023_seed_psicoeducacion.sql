-- =============================================================================
-- NOEMA · 00023 · Seed de psicoeducación (requerimiento #3)
-- =============================================================================
-- Contenido psicoeducativo para pacientes sobre 7 temas/corrientes.
-- Redactado en lenguaje accesible y cálido, como pide el requerimiento.
--
-- ⚠️ BORRADOR CLÍNICO: publicado = false. Un profesional de salud mental debe
-- revisar y aprobar cada pieza antes de mostrarla a pacientes. El terapeuta
-- podrá publicarlas desde el panel una vez validadas.
--
-- Idempotente por título.
-- =============================================================================

-- Categoría de psicoeducación (si no existe)
insert into public.categorias (key, nombre, descripcion, orden, activa)
values ('psicoeducacion', 'Psicoeducación', 'Contenido para entender tu proceso terapéutico', 10, true)
on conflict (key) do nothing;

do $$
declare
  v_existe boolean;
begin

  -- 1. ANSIEDAD
  select exists(select 1 from public.contenido_educativo where titulo = 'Entender la ansiedad') into v_existe;
  if not v_existe then
    insert into public.contenido_educativo
      (titulo, subtitulo, descripcion, tipo, categoria_key, etiquetas, nivel, autor_nombre, publicado)
    values (
      'Entender la ansiedad',
      'Qué es, por qué aparece y cómo se trabaja',
      $md$**La ansiedad no es tu enemiga.** Es un sistema de alarma que todos tenemos y que existe para protegernos. El problema aparece cuando esa alarma se activa demasiado seguido, o ante cosas que no son peligros reales.

**¿Qué se siente?** Puede ser corazón acelerado, respiración corta, pensamientos que giran en círculo, tensión, o esa sensación de que "algo malo va a pasar". Es incómodo, pero no es peligroso.

**¿Por qué aparece?** Muchas veces la mente anticipa amenazas para "prepararnos". El cuerpo responde como si el peligro fuera real. Evitar lo que nos da ansiedad da alivio a corto plazo, pero a la larga la hace más fuerte.

**¿Cómo se trabaja en terapia?** Aprendiendo a reconocer las señales, a cuestionar los pensamientos catastróficos, y a acercarnos poco a poco a lo que evitamos, a nuestro ritmo. No se trata de eliminar la ansiedad, sino de que deje de gobernar tu vida.

Tu terapeuta te acompañará en este proceso. Ir despacio también es avanzar.$md$,
      'guia', 'psicoeducacion', array['ansiedad','tcc'], 'inicial', 'Equipo NOEMA', false
    );
  end if;

  -- 2. DEPRESIÓN
  select exists(select 1 from public.contenido_educativo where titulo = 'Entender la depresión') into v_existe;
  if not v_existe then
    insert into public.contenido_educativo
      (titulo, subtitulo, descripcion, tipo, categoria_key, etiquetas, nivel, autor_nombre, publicado)
    values (
      'Entender la depresión',
      'Más que tristeza',
      $md$**La depresión no es debilidad ni "falta de ganas".** Es una condición que afecta cómo te sientes, cómo piensas y cómo tu cuerpo funciona. No se sale de ella "echándole ganas", igual que no se sale de una gripe con voluntad.

**¿Qué se siente?** Tristeza profunda o vacío, pérdida de interés en cosas que antes disfrutabas, cansancio, cambios en el sueño y el apetito, pensamientos duros hacia una/o misma/o. A veces no hay tristeza, solo apatía.

**Un círculo difícil:** cuando te sientes mal, haces menos; al hacer menos, tienes menos momentos agradables; y eso te hace sentir peor. Romper ese círculo es parte central del tratamiento.

**¿Cómo se trabaja?** Poco a poco, recuperando actividades que dan sentido o agrado (aunque al inicio no tengas ganas), cuestionando la voz crítica interna, y reconstruyendo rutinas. La mejoría suele ser gradual, con altibajos. Cada pequeño paso cuenta.

Si en algún momento tienes pensamientos de hacerte daño, busca apoyo de inmediato: no estás sola/o y hay ayuda disponible.$md$,
      'guia', 'psicoeducacion', array['depresion','activacion_conductual'], 'inicial', 'Equipo NOEMA', false
    );
  end if;

  -- 3. TERAPIA COGNITIVO CONDUCTUAL (TCC)
  select exists(select 1 from public.contenido_educativo where titulo = 'La Terapia Cognitivo-Conductual (TCC)') into v_existe;
  if not v_existe then
    insert into public.contenido_educativo
      (titulo, subtitulo, descripcion, tipo, categoria_key, etiquetas, nivel, autor_nombre, publicado)
    values (
      'La Terapia Cognitivo-Conductual (TCC)',
      'La conexión entre lo que piensas, sientes y haces',
      $md$La **TCC** parte de una idea sencilla pero poderosa: lo que **pensamos**, lo que **sentimos** y lo que **hacemos** están conectados. Cambiar uno influye en los otros.

**Un ejemplo:** dos personas reciben el mismo mensaje "necesitamos hablar". Una piensa "me van a despedir" (y siente angustia). Otra piensa "quizás quieren felicitarme" (y siente curiosidad). El hecho es el mismo; la interpretación cambia la emoción.

**¿Qué haremos en TCC?**
- Identificar los pensamientos automáticos que disparan malestar.
- Examinarlos con evidencia, sin creerlos ni descartarlos a ciegas.
- Probar comportamientos nuevos que rompan círculos que te atrapan.

Es una terapia **activa y práctica**: harás ejercicios entre sesiones (como los que tu terapeuta te asigna aquí en NOEMA). Esos ejercicios son donde ocurre gran parte del cambio.$md$,
      'guia', 'psicoeducacion', array['tcc'], 'inicial', 'Equipo NOEMA', false
    );
  end if;

  -- 4. ACTIVACIÓN CONDUCTUAL
  select exists(select 1 from public.contenido_educativo where titulo = 'Activación conductual') into v_existe;
  if not v_existe then
    insert into public.contenido_educativo
      (titulo, subtitulo, descripcion, tipo, categoria_key, etiquetas, nivel, autor_nombre, publicado)
    values (
      'Activación conductual',
      'Actuar primero, las ganas llegan después',
      $md$Cuando nos sentimos mal, es natural querer descansar y esperar a "tener ganas" para hacer las cosas. Pero en la depresión, esperar las ganas puede dejarnos atrapados: mientras menos hacemos, peor nos sentimos.

**La activación conductual invierte el orden:** primero actuamos (con pasos pequeños), y las ganas y el ánimo tienden a venir después.

**¿Cómo funciona?**
- Recuperamos actividades que antes te daban **agrado** (un café, música, caminar) o **sentido** (algo importante para ti).
- Empezamos con pasos muy pequeños y realistas. No "hacer ejercicio una hora", sino "ponerme los tenis y salir 5 minutos".
- Observamos cómo cada actividad afecta tu ánimo, para elegir mejor.

No se trata de llenarte de tareas ni de fingir que estás bien. Se trata de reconstruir, ladrillo a ladrillo, una vida que se sienta más tuya.$md$,
      'guia', 'psicoeducacion', array['depresion','activacion_conductual'], 'inicial', 'Equipo NOEMA', false
    );
  end if;

  -- 5. TERAPIA DE ACEPTACIÓN Y COMPROMISO (ACT)
  select exists(select 1 from public.contenido_educativo where titulo = 'Terapia de Aceptación y Compromiso (ACT)') into v_existe;
  if not v_existe then
    insert into public.contenido_educativo
      (titulo, subtitulo, descripcion, tipo, categoria_key, etiquetas, nivel, autor_nombre, publicado)
    values (
      'Terapia de Aceptación y Compromiso (ACT)',
      'Hacer espacio al malestar y vivir según tus valores',
      $md$La **ACT** propone algo distinto a "eliminar" el malestar: aprender a **hacerle espacio** para que no te impida vivir lo que te importa.

**Ideas centrales:**
- **Aceptación:** dejar de pelear con emociones y pensamientos difíciles. Luchar contra ellos suele darles más fuerza. Aceptar no es resignarse; es dejar de gastar energía en una batalla imposible.
- **Defusión:** aprender a ver los pensamientos como lo que son (palabras, ideas) y no como verdades absolutas. "Tengo el pensamiento de que no valgo" en lugar de "no valgo".
- **Valores:** identificar qué tipo de persona quieres ser y qué le da sentido a tu vida.
- **Acción comprometida:** dar pasos hacia esos valores, incluso cargando con algo de malestar.

**Una metáfora:** imagina que la vida es conducir un autobús. Tus miedos y pensamientos difíciles son pasajeros ruidosos. No puedes echarlos, pero sí puedes seguir conduciendo hacia donde tú quieres ir, aunque griten en los asientos de atrás.$md$,
      'guia', 'psicoeducacion', array['act'], 'intermedio', 'Equipo NOEMA', false
    );
  end if;

  -- 6. TERAPIA DIALÉCTICA CONDUCTUAL (DBT)
  select exists(select 1 from public.contenido_educativo where titulo = 'Terapia Dialéctica Conductual (DBT)') into v_existe;
  if not v_existe then
    insert into public.contenido_educativo
      (titulo, subtitulo, descripcion, tipo, categoria_key, etiquetas, nivel, autor_nombre, publicado)
    values (
      'Terapia Dialéctica Conductual (DBT)',
      'Habilidades para las emociones intensas',
      $md$La **DBT** fue creada para personas que sienten las emociones de forma muy intensa y a quienes les cuesta regularlas. Su palabra clave es **dialéctica**: sostener dos verdades a la vez, como *"te acepto tal como eres"* **y** *"trabajemos para que estés mejor"*.

**Enseña cuatro grupos de habilidades:**
- **Mindfulness:** observar tu experiencia presente sin juzgarla.
- **Tolerancia al malestar:** sobrevivir a las crisis sin empeorar las cosas (sin conductas impulsivas de las que luego te arrepientas).
- **Regulación emocional:** entender tus emociones y reducir la vulnerabilidad a las que te desbordan.
- **Efectividad interpersonal:** pedir lo que necesitas y poner límites, cuidando tus relaciones y tu autorrespeto.

Es una terapia muy **práctica**: se aprenden habilidades concretas y se practican en la vida diaria. Piensa en ellas como herramientas que vas guardando en tu caja para usarlas cuando las emociones aprietan.$md$,
      'guia', 'psicoeducacion', array['dbt'], 'intermedio', 'Equipo NOEMA', false
    );
  end if;

  -- 7. PSICOTERAPIA ANALÍTICO FUNCIONAL (FAP)
  select exists(select 1 from public.contenido_educativo where titulo = 'Psicoterapia Analítico-Funcional (FAP)') into v_existe;
  if not v_existe then
    insert into public.contenido_educativo
      (titulo, subtitulo, descripcion, tipo, categoria_key, etiquetas, nivel, autor_nombre, publicado)
    values (
      'Psicoterapia Analítico-Funcional (FAP)',
      'La relación terapéutica como espacio de cambio',
      $md$La **FAP** pone el foco en algo particular: lo que ocurre **aquí y ahora**, dentro de la relación entre tú y tu terapeuta, como un espacio real para cambiar.

**La idea:** muchas de las dificultades que vivimos con otras personas (para confiar, poner límites, mostrar lo que sentimos, pedir ayuda) también aparecen, en pequeño, dentro de la terapia. Y ahí, en un entorno seguro, se pueden observar y trabajar en vivo.

**¿Cómo se trabaja?**
- Tu terapeuta presta atención a cómo te relacionas durante la sesión.
- Cuando aparece una dificultad tuya en la relación (por ejemplo, te cuesta expresar desacuerdo), se vuelve una oportunidad para practicarlo de otra manera.
- Se refuerzan tus avances en el momento en que ocurren.

**En pocas palabras:** la relación terapéutica no es solo el medio, es también parte del cambio. Lo que aprendes a hacer distinto con tu terapeuta, poco a poco lo llevas a tus otras relaciones.$md$,
      'guia', 'psicoeducacion', array['fap'], 'avanzado', 'Equipo NOEMA', false
    );
  end if;

end $$;
