/**
 * Seed de paciente demo COMPLETO para que el panel del terapeuta se vea lleno.
 *
 * Crea "María González" vinculada con Dra. Andrea Ruiz (primer terapeuta del seed)
 * con 14 días de actividad realista:
 *  - 18 registros emocionales (mezcla de privacidad)
 *  - 4 entradas de diario
 *  - 2 tareas asignadas con respuestas
 *  - 2 sesiones (1 pasada con notas, 1 próxima)
 *  - 5 mensajes en el thread (3 paciente, 2 terapeuta)
 *
 * Uso: pnpm tsx scripts/seed_paciente_demo.ts
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54621';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TERAPEUTA_EMAIL = 'andrea.ruiz@demo.noema.app';
const PACIENTE_EMAIL = 'maria.gonzalez@demo.noema.app';
const PACIENTE_NOMBRE = 'María González';

// Helper: fecha relativa a hoy (YYYY-MM-DD)
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function timeAt(hour: number, min = 0): string {
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
}
function isoAt(daysFromNow: number, hour: number, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

interface RegistroSeed {
  diasAtras: number;
  hora: number;
  emocion: string;
  intensidad: number;
  descripcion?: string;
  detonante?: string;
  privacidad: 'privado' | 'compartido' | 'marcado_sesion';
}

const registros: RegistroSeed[] = [
  { diasAtras: 13, hora: 9, emocion: 'tranquilo', intensidad: 2, descripcion: 'Desperté con calma, dormí bien.', privacidad: 'compartido' },
  { diasAtras: 13, hora: 18, emocion: 'ansioso', intensidad: 3, descripcion: 'Reunión con mi jefa me dejó tensa.', detonante: 'Trabajo', privacidad: 'compartido' },
  { diasAtras: 12, hora: 11, emocion: 'ansioso', intensidad: 4, descripcion: 'No paro de pensar en lo que me dijo ayer.', detonante: 'Pensamientos repetitivos', privacidad: 'compartido' },
  { diasAtras: 12, hora: 21, emocion: 'cansado', intensidad: 4, descripcion: 'Día agotador, sin energía para nada.', privacidad: 'compartido' },
  { diasAtras: 11, hora: 8, emocion: 'tranquilo', intensidad: 2, descripcion: 'Hice yoga, me ayudó.', privacidad: 'compartido' },
  { diasAtras: 11, hora: 19, emocion: 'triste', intensidad: 3, descripcion: 'Hablé con mi mamá, hubo distancia.', detonante: 'Familia', privacidad: 'privado' },
  { diasAtras: 10, hora: 14, emocion: 'feliz', intensidad: 4, descripcion: 'Reí mucho con mis amigas en la comida.', privacidad: 'compartido' },
  { diasAtras: 9, hora: 22, emocion: 'ansioso', intensidad: 5, descripcion: 'Crisis de ansiedad. Sentí que no podía respirar. Esto necesito hablarlo en sesión.', detonante: 'Pensamientos catastróficos', privacidad: 'marcado_sesion' },
  { diasAtras: 8, hora: 10, emocion: 'cansado', intensidad: 3, descripcion: 'Resaca emocional de anoche.', privacidad: 'compartido' },
  { diasAtras: 8, hora: 20, emocion: 'tranquilo', intensidad: 3, descripcion: 'Hice el ejercicio de respiración que me enviaste, ayudó.', privacidad: 'compartido' },
  { diasAtras: 7, hora: 9, emocion: 'tranquilo', intensidad: 3, privacidad: 'compartido' },
  { diasAtras: 6, hora: 16, emocion: 'ansioso', intensidad: 3, descripcion: 'Pensar en el cumpleaños de mi mamá me pone tensa.', detonante: 'Familia', privacidad: 'marcado_sesion' },
  { diasAtras: 5, hora: 11, emocion: 'feliz', intensidad: 3, descripcion: 'Fui al parque sola y la pasé bien.', privacidad: 'compartido' },
  { diasAtras: 4, hora: 22, emocion: 'triste', intensidad: 3, descripcion: 'Me sentí muy sola hoy, sin saber por qué.', privacidad: 'privado' },
  { diasAtras: 3, hora: 8, emocion: 'tranquilo', intensidad: 2, privacidad: 'compartido' },
  { diasAtras: 2, hora: 17, emocion: 'ansioso', intensidad: 4, descripcion: 'Mi pareja me canceló el plan. Reaccioné peor de lo que quisiera.', detonante: 'Pareja', privacidad: 'marcado_sesion' },
  { diasAtras: 1, hora: 9, emocion: 'cansado', intensidad: 3, descripcion: 'Dormí mal por estar pensando.', privacidad: 'compartido' },
  { diasAtras: 0, hora: 8, emocion: 'tranquilo', intensidad: 3, descripcion: 'Hoy me siento más en calma. Lista para la sesión.', privacidad: 'compartido' },
];

const diario: Array<{
  diasAtras: number;
  titulo: string | null;
  contenido: string;
  privacidad: 'privado' | 'compartido' | 'marcado_sesion';
}> = [
  {
    diasAtras: 12,
    titulo: 'No puedo dejar de pensar en lo que me dijo',
    contenido:
      'Le doy vueltas y vueltas. Que si lo dijo en serio, que si fue solo un comentario. Por qué me afecta tanto. ¿Por qué tanta gente lo nota antes que yo? Me cuesta pedir lo que necesito en el trabajo. Termino sintiéndome menos.',
    privacidad: 'compartido',
  },
  {
    diasAtras: 9,
    titulo: 'Algo que no le he dicho a nadie',
    contenido:
      'A veces siento que estoy demasiado cansada de fingir que todo está bien. Pero también me da miedo dejar de hacerlo. Si paro, ¿qué queda? ¿Quién soy si no soy la que aguanta?',
    privacidad: 'privado',
  },
  {
    diasAtras: 6,
    titulo: null,
    contenido:
      'Hoy hice el ejercicio que me enviaste. Al principio no quería. Después de unos minutos noté que sí me bajó la respiración. Tal vez sí funciona.',
    privacidad: 'compartido',
  },
  {
    diasAtras: 2,
    titulo: 'Sobre lo de mi pareja',
    contenido:
      'No sé si exageré. Me dolió que cancelara, pero más me dolió cómo lo dijo. Como si fuera obvio que su tiempo vale más que el mío. Reaccioné con un mensaje horrible. Después lloré. No quiero ser así pero algo se prende y no puedo parar. Esto sí quiero hablarlo el jueves.',
    privacidad: 'marcado_sesion',
  },
];

async function main() {
  console.log('🌱 Sembrando paciente demo (María González)...\n');

  // 1. Encontrar al terapeuta demo
  const { data: usersList } = await admin.auth.admin.listUsers();
  const terapeutaUser = usersList?.users.find((u) => u.email === TERAPEUTA_EMAIL);
  if (!terapeutaUser) {
    console.error(`✗ No existe terapeuta ${TERAPEUTA_EMAIL}. Corre primero seed_demo_data.ts`);
    process.exit(1);
  }
  console.log(`  ✓ Terapeuta encontrado: ${terapeutaUser.id}`);

  // 2. Crear o reciclar paciente
  let pacienteId: string;
  const existingPaciente = usersList?.users.find((u) => u.email === PACIENTE_EMAIL);
  if (existingPaciente) {
    pacienteId = existingPaciente.id;
    console.log(`  ✓ Paciente ya existía: ${pacienteId}`);
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: PACIENTE_EMAIL,
      password: 'demo-noema-2026',
      email_confirm: true,
      user_metadata: { nombre: PACIENTE_NOMBRE, rol: 'paciente' },
    });
    if (error || !created.user) {
      console.error('  ✗', error?.message);
      process.exit(1);
    }
    pacienteId = created.user.id;
    console.log(`  ✓ Paciente creado: ${pacienteId}`);
  }

  // 3. Profile
  await admin.from('profiles').upsert(
    {
      id: pacienteId,
      email: PACIENTE_EMAIL,
      nombre: PACIENTE_NOMBRE,
      rol: 'paciente',
      ciudad: 'Ciudad de México',
      onboarding_completo: true,
    },
    { onConflict: 'id' },
  );

  // 3b. Tabla pacientes (1:1 con profile) — necesaria para FK de vinculaciones
  await admin.from('pacientes').upsert(
    {
      profile_id: pacienteId,
      ocupacion: 'Coordinadora de marketing',
      motivos_consulta: ['ansiedad', 'autoestima', 'relaciones'],
    },
    { onConflict: 'profile_id' },
  );

  // 4. Crear vinculación activa
  const { data: vinculacionExistente } = await admin
    .from('vinculaciones')
    .select('id')
    .eq('terapeuta_id', terapeutaUser.id)
    .eq('paciente_id', pacienteId)
    .maybeSingle();

  let vinculacionId: string;
  if (vinculacionExistente) {
    vinculacionId = vinculacionExistente.id;
    console.log(`  ✓ Vinculación existía: ${vinculacionId}`);
  } else {
    const { data: vinc, error: vErr } = await admin
      .from('vinculaciones')
      .insert({
        terapeuta_id: terapeutaUser.id,
        paciente_id: pacienteId,
        nombre_invitado: PACIENTE_NOMBRE,
        email_invitado: PACIENTE_EMAIL,
        estado: 'activa',
        fecha_inicio: daysAgo(45),
        consentimiento_aceptado_at: new Date(Date.now() - 45 * 86400000).toISOString(),
        version_consentimiento: '2026-05-v1',
        notificar_crisis_terapeuta: true,
        codigo_invitacion: '',
      })
      .select('id')
      .single();
    if (vErr || !vinc) {
      console.error('  ✗ vinculacion:', vErr?.message);
      process.exit(1);
    }
    vinculacionId = vinc.id;
    console.log(`  ✓ Vinculación creada: ${vinculacionId}`);
  }

  // 5. Limpiar datos previos del paciente (para idempotencia del seed)
  await admin.from('registros_emocionales').delete().eq('paciente_id', pacienteId);
  await admin.from('diario_entradas').delete().eq('paciente_id', pacienteId);
  await admin.from('tareas').delete().eq('vinculacion_id', vinculacionId);
  await admin.from('sesiones').delete().eq('vinculacion_id', vinculacionId);
  await admin.from('mensajes').delete().eq('vinculacion_id', vinculacionId);

  // 6. Registros emocionales
  const regsToInsert = registros.map((r) => ({
    paciente_id: pacienteId,
    emocion_principal_key: r.emocion,
    intensidad: r.intensidad,
    fecha: daysAgo(r.diasAtras),
    hora: timeAt(r.hora),
    descripcion: r.descripcion ?? null,
    situacion_detonante: r.detonante ?? null,
    privacidad: r.privacidad,
  }));
  await admin.from('registros_emocionales').insert(regsToInsert);
  console.log(`  ✓ ${registros.length} registros emocionales`);

  // 7. Diario
  await admin.from('diario_entradas').insert(
    diario.map((d) => ({
      paciente_id: pacienteId,
      fecha: daysAgo(d.diasAtras),
      titulo: d.titulo,
      contenido: d.contenido,
      privacidad: d.privacidad,
    })),
  );
  console.log(`  ✓ ${diario.length} entradas de diario`);

  // 8. Sesiones: 1 pasada (con notas), 1 próxima
  const { data: sesionPasada } = await admin
    .from('sesiones')
    .insert({
      vinculacion_id: vinculacionId,
      fecha_programada: isoAt(-7, 16, 0),
      fecha_realizada: isoAt(-7, 17, 0),
      duracion_min: 60,
      modalidad: 'online',
      link_videollamada: 'https://meet.google.com/abc-defg-hij',
      estado: 'realizada',
    })
    .select('id')
    .single();

  if (sesionPasada) {
    await admin.from('sesion_notas').insert({
      sesion_id: sesionPasada.id,
      autor_id: terapeutaUser.id,
      contenido_publico:
        'Hablamos de los pensamientos catastróficos que aparecen en momentos de estrés laboral. Practicaste la respiración 4-7-8 y notaste alivio.',
      contenido_privado:
        'María presenta patrón claro de hiperexigencia → ansiedad anticipatoria → cogniciones catastróficas. Está empezando a reconocer el patrón pero todavía cree firmemente en los pensamientos. Trabajar próximas sesiones: identificación de distorsiones cognitivas + relación con figura materna (probable origen).',
      plan_proxima_sesion:
        'Continuar con técnica de respiración. Introducir hoja de registro de pensamientos automáticos. Explorar evento con pareja del jueves pasado.',
      visible_paciente: true,
    });
  }

  await admin.from('sesiones').insert({
    vinculacion_id: vinculacionId,
    fecha_programada: isoAt(2, 16, 0), // 2 días en el futuro
    duracion_min: 60,
    modalidad: 'online',
    link_videollamada: 'https://meet.google.com/abc-defg-hij',
    estado: 'programada',
  });
  console.log(`  ✓ 2 sesiones (1 con notas)`);

  // 9. Tareas con respuestas
  const { data: tarea1 } = await admin
    .from('tareas')
    .insert({
      vinculacion_id: vinculacionId,
      asignada_por: terapeutaUser.id,
      titulo: 'Respiración consciente diaria',
      descripcion: 'Práctica diaria de 5 minutos antes de dormir. Inhala 4s, sostén 7s, exhala 8s.',
      contenido_md: 'Encuentra un lugar tranquilo. Cierra los ojos. Repite el ciclo 4 veces.',
      frecuencia: 'diaria',
      estado: 'en_progreso',
    })
    .select('id')
    .single();

  if (tarea1) {
    await admin.from('tarea_respuestas').insert([
      {
        tarea_id: tarea1.id,
        paciente_id: pacienteId,
        fecha: daysAgo(5),
        hora: timeAt(22, 30),
        texto_libre: 'Lo intenté al inicio costó pero después noté la diferencia. Bajé la respiración rápido.',
        dificultad_percibida: 3,
        compartir_terapeuta: true,
      },
      {
        tarea_id: tarea1.id,
        paciente_id: pacienteId,
        fecha: daysAgo(2),
        hora: timeAt(22, 15),
        texto_libre: 'Hoy no me dieron ganas, pero igual lo hice. Me ayudó a calmarme después del pleito con mi pareja.',
        dificultad_percibida: 4,
        compartir_terapeuta: true,
      },
    ]);
  }

  await admin.from('tareas').insert({
    vinculacion_id: vinculacionId,
    asignada_por: terapeutaUser.id,
    titulo: 'Registro de pensamientos automáticos',
    descripcion: 'Cuando aparezca un pensamiento catastrófico, anótalo y la situación que lo disparó.',
    frecuencia: 'unica',
    fecha_limite: daysAgo(-7), // dentro de 7 días
    estado: 'pendiente',
  });
  console.log(`  ✓ 2 tareas (1 con 2 respuestas)`);

  // 10. Mensajes en el thread
  await admin.from('mensajes').insert([
    {
      vinculacion_id: vinculacionId,
      autor_id: terapeutaUser.id,
      contenido: 'María, te envié el audio de respiración que practicamos. Cuando lo escuches, cuéntame cómo te fue.',
      creado_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      leido_at: new Date(Date.now() - 9 * 86400000 + 3600000).toISOString(),
    },
    {
      vinculacion_id: vinculacionId,
      autor_id: pacienteId,
      contenido: 'Gracias Andrea. Lo escuché anoche cuando me empecé a sentir ansiosa. Ayudó bastante.',
      creado_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      leido_at: new Date(Date.now() - 8 * 86400000 + 1800000).toISOString(),
    },
    {
      vinculacion_id: vinculacionId,
      autor_id: terapeutaUser.id,
      contenido: 'Qué bueno que te sirvió. Recuerda que cualquier emoción es información, no hay que combatirla.',
      creado_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      leido_at: new Date(Date.now() - 7 * 86400000 + 7200000).toISOString(),
    },
    {
      vinculacion_id: vinculacionId,
      autor_id: pacienteId,
      contenido: 'Quería pedirte si podemos hablar el jueves sobre algo que pasó con mi pareja. Lo dejé en el diario marcado para sesión.',
      creado_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      leido_at: null, // no leído por la terapeuta (badge en panel)
    },
  ]);
  console.log(`  ✓ 4 mensajes (1 sin leer)`);

  console.log('\n✓ Listo. Refresca el panel y entra a la ficha de María González.');
  console.log(`   Email del paciente (para login mobile): ${PACIENTE_EMAIL}`);
  console.log(`   Password: demo-noema-2026`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
