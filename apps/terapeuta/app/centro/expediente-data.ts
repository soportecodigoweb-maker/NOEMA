// Expediente completo del paciente para SUPERVISIÓN clínica: replica lo que ve
// el terapeuta en su panel, en solo lectura. Respeta la privacidad del paciente
// (solo lo que él compartió; lo marcado como privado nunca sale).
import { createClient as createAdminClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function unwrap<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}

const fFecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : '—';
const fFechaHora = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Mexico_City',
      })
    : '—';

export interface Expediente {
  paciente: {
    nombre: string;
    email: string;
    ciudad: string | null;
    edad: string;
    genero: string | null;
    ocupacion: string | null;
    motivos: string[];
  };
  vinculacion: { desde: string; nivelRiesgo: string; estado: string };
  metricas: {
    registros: number;
    intensidadPromedio: number | null;
    tareas: number;
    tareasCompletadas: number;
    adherencia: number | null;
    sesionesRealizadas: number;
    sesionesCanceladas: number;
    alertasCrisis: number;
  };
  registros: {
    fecha: string;
    hora: string | null;
    emocion: string;
    intensidad: number;
    detonante: string | null;
    necesidad: string | null;
  }[];
  diario: { fecha: string; titulo: string | null; contenido: string }[];
  sesiones: {
    fecha: string;
    estado: string;
    modalidad: string | null;
    objetivos: string[];
    notaPublica: string | null;
    notaPrivada: string | null;
    plan: string | null;
  }[];
  ejercicios: {
    titulo: string;
    estado: string;
    fechaLimite: string | null;
    respuestas: { fecha: string; texto: string | null; dificultad: number | null; retro: string | null }[];
  }[];
  expedienteInicial: Record<string, unknown> | null;
  planApoyo: {
    contacto: string | null;
    planSeguridad: string;
    recursos: { titulo: string; tipo: string }[];
    usos: number;
  } | null;
}

export async function expedienteSupervision(vinculacionId: string): Promise<Expediente | null> {
  const db = admin();
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('id, paciente_id, estado, nivel_riesgo, fecha_inicio')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc || !vinc.paciente_id) return null;
  const pid = vinc.paciente_id;

  const [
    { data: prof },
    { data: pacRow },
    { data: catalogo },
    { data: regs },
    { data: diario },
    { data: sesiones },
    { data: tareas },
    { count: alertas },
    { data: expIni },
    { data: plan },
    { data: recursos },
    { count: usosPlan },
  ] = await Promise.all([
    db.from('profiles').select('nombre, email, ciudad').eq('id', pid).maybeSingle(),
    db.from('pacientes').select('fecha_nacimiento, genero, ocupacion, motivos_consulta').eq('profile_id', pid).maybeSingle(),
    db.from('emociones_catalogo').select('key, nombre_es'),
    db
      .from('registros_emocionales')
      .select('fecha, hora, emocion_principal_key, intensidad, situacion_detonante, necesidad, privacidad')
      .eq('paciente_id', pid)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .order('fecha', { ascending: false })
      .limit(120),
    db
      .from('diario_entradas')
      .select('fecha, titulo, contenido, privacidad')
      .eq('paciente_id', pid)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .order('fecha', { ascending: false })
      .limit(40),
    db
      .from('sesiones')
      .select('fecha_programada, estado, modalidad, nota:sesion_notas(objetivos_trabajados, contenido_publico, contenido_privado, plan_proxima_sesion)')
      .eq('vinculacion_id', vinculacionId)
      .order('fecha_programada', { ascending: false })
      .limit(40),
    db
      .from('tareas')
      .select('titulo, estado, fecha_limite, respuestas:tarea_respuestas(fecha, texto_libre, dificultad_percibida, retroalimentacion)')
      .eq('vinculacion_id', vinculacionId)
      .order('creado_at', { ascending: false })
      .limit(40),
    db.from('alertas_crisis').select('*', { count: 'exact', head: true }).eq('paciente_id', pid),
    db.from('expediente_inicial').select('*').eq('vinculacion_id', vinculacionId).maybeSingle(),
    db
      .from('plan_apoyo')
      .select('contacto_nombre, contacto_relacion, plan_seguridad')
      .eq('vinculacion_id', vinculacionId)
      .maybeSingle(),
    db.from('plan_apoyo_recursos').select('titulo, tipo').eq('vinculacion_id', vinculacionId),
    db.from('plan_apoyo_usos').select('*', { count: 'exact', head: true }).eq('vinculacion_id', vinculacionId),
  ]);

  const nombreEmocion = new Map((catalogo ?? []).map((e) => [e.key, e.nombre_es]));
  const r = regs ?? [];
  const t = tareas ?? [];
  const s = sesiones ?? [];

  let edad = '—';
  if (pacRow?.fecha_nacimiento) {
    const nac = new Date(pacRow.fecha_nacimiento);
    if (!Number.isNaN(nac.getTime())) {
      const hoy = new Date();
      let e = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
      if (e >= 0 && e < 130) edad = `${e} años`;
    }
  }

  const completadas = t.filter((x) => x.estado === 'completada').length;
  const enProgreso = t.filter((x) => x.estado === 'completada' || x.estado === 'en_progreso').length;

  return {
    paciente: {
      nombre: prof?.nombre ?? 'Paciente',
      email: prof?.email ?? '—',
      ciudad: prof?.ciudad ?? null,
      edad,
      genero: pacRow?.genero ?? null,
      ocupacion: pacRow?.ocupacion ?? null,
      motivos: pacRow?.motivos_consulta ?? [],
    },
    vinculacion: {
      desde: fFecha(vinc.fecha_inicio),
      nivelRiesgo: vinc.nivel_riesgo ?? 'sin_evaluar',
      estado: vinc.estado,
    },
    metricas: {
      registros: r.length,
      intensidadPromedio: r.length ? Math.round((r.reduce((a, x) => a + x.intensidad, 0) / r.length) * 10) / 10 : null,
      tareas: t.length,
      tareasCompletadas: completadas,
      adherencia: t.length ? Math.round((enProgreso / t.length) * 100) : null,
      sesionesRealizadas: s.filter((x) => x.estado === 'realizada').length,
      sesionesCanceladas: s.filter((x) => x.estado === 'cancelada').length,
      alertasCrisis: alertas ?? 0,
    },
    registros: r.map((x) => ({
      fecha: x.fecha,
      hora: x.hora ? String(x.hora).slice(0, 5) : null,
      emocion: nombreEmocion.get(x.emocion_principal_key) ?? x.emocion_principal_key,
      intensidad: x.intensidad,
      detonante: x.situacion_detonante,
      necesidad: x.necesidad,
    })),
    diario: (diario ?? []).map((d) => ({ fecha: d.fecha, titulo: d.titulo, contenido: d.contenido ?? '' })),
    sesiones: s.map((x) => {
      const nota = unwrap(x.nota) as {
        objetivos_trabajados?: string[];
        contenido_publico?: string | null;
        contenido_privado?: string | null;
        plan_proxima_sesion?: string | null;
      } | null;
      return {
        fecha: fFecha(x.fecha_programada),
        estado: x.estado,
        modalidad: x.modalidad ?? null,
        objetivos: nota?.objetivos_trabajados ?? [],
        notaPublica: nota?.contenido_publico ?? null,
        notaPrivada: nota?.contenido_privado ?? null,
        plan: nota?.plan_proxima_sesion ?? null,
      };
    }),
    ejercicios: t.map((x: any) => ({
      titulo: x.titulo,
      estado: x.estado,
      fechaLimite: x.fecha_limite ? fFecha(x.fecha_limite) : null,
      respuestas: (x.respuestas ?? []).map((rr: any) => ({
        fecha: fFechaHora(rr.fecha),
        texto: rr.texto_libre,
        dificultad: rr.dificultad_percibida,
        retro: rr.retroalimentacion,
      })),
    })),
    expedienteInicial: (expIni as Record<string, unknown> | null) ?? null,
    planApoyo: plan
      ? {
          contacto: plan.contacto_nombre
            ? `${plan.contacto_nombre}${plan.contacto_relacion ? ` (${plan.contacto_relacion})` : ''}`
            : null,
          planSeguridad: plan.plan_seguridad ?? '',
          recursos: (recursos ?? []).map((x) => ({ titulo: x.titulo, tipo: x.tipo })),
          usos: usosPlan ?? 0,
        }
      : null,
  };
}
