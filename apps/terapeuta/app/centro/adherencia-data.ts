// Resumen de adherencia al tratamiento por terapeuta (supervisión de calidad).
// Solo métricas agregadas de actividad: no expone contenido clínico.
import { createClient as createAdminClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface AdherenciaPaciente {
  vinculacionId: string;
  nombre: string;
  registros30: number;
  tareasAsignadas: number;
  tareasCompletadas: number;
  adherencia: number | null;
  sesionesRealizadas: number;
  sesionesCanceladas: number;
  notasTerapeuta: number;
  retroalimentaciones: number;
  diasSinActividad: number | null;
  semaforo: 'bien' | 'atencion' | 'riesgo';
}

export interface AdherenciaTerapeuta {
  nombre: string;
  pacientes: AdherenciaPaciente[];
  promedioAdherencia: number | null;
  totalPacientes: number;
  enRiesgo: number;
  // Qué prácticas se asocian a mejor adherencia (comparativa interna).
  hallazgos: string[];
}

const dias = (iso: string | null): number | null => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

export async function adherenciaDeTerapeuta(
  centroId: string,
  terapeutaId: string,
): Promise<AdherenciaTerapeuta | null> {
  const db = admin();
  const { data: miembro } = await db
    .from('centro_terapeutas')
    .select('terapeuta_nombre')
    .eq('centro_id', centroId)
    .eq('terapeuta_id', terapeutaId)
    .maybeSingle();
  if (!miembro) return null;

  const { data: vincs } = await db
    .from('vinculaciones')
    .select('id, paciente_id')
    .eq('terapeuta_id', terapeutaId)
    .in('estado', ['activa', 'pausada']);
  const lista = vincs ?? [];
  if (lista.length === 0) {
    return {
      nombre: miembro.terapeuta_nombre ?? 'Terapeuta',
      pacientes: [],
      promedioAdherencia: null,
      totalPacientes: 0,
      enRiesgo: 0,
      hallazgos: [],
    };
  }

  const vids = lista.map((v) => v.id);
  const pids = lista.map((v) => v.paciente_id).filter((x): x is string => !!x);
  const desde30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [{ data: profs }, { data: regs }, { data: tareas }, { data: sesiones }, { data: notas }, { data: resp }] =
    await Promise.all([
      pids.length
        ? db.from('profiles').select('id, nombre').in('id', pids)
        : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
      pids.length
        ? db
            .from('registros_emocionales')
            .select('paciente_id, fecha')
            .in('paciente_id', pids)
            .gte('fecha', desde30)
        : Promise.resolve({ data: [] as { paciente_id: string; fecha: string }[] }),
      db.from('tareas').select('id, vinculacion_id, estado').in('vinculacion_id', vids),
      db.from('sesiones').select('vinculacion_id, estado').in('vinculacion_id', vids),
      db.from('notas_privadas').select('vinculacion_id').in('vinculacion_id', vids),
      db.from('tarea_respuestas').select('tarea_id, retroalimentacion'),
    ]);

  const nombres = new Map((profs ?? []).map((p) => [p.id, p.nombre]));
  const tareaVinc = new Map((tareas ?? []).map((t) => [t.id, t.vinculacion_id]));

  const pacientes: AdherenciaPaciente[] = lista.map((v) => {
    const pid = v.paciente_id ?? '';
    const regsPac = (regs ?? []).filter((r) => r.paciente_id === pid);
    const tareasPac = (tareas ?? []).filter((t) => t.vinculacion_id === v.id);
    const completadas = tareasPac.filter((t) => t.estado === 'completada').length;
    const conProgreso = tareasPac.filter((t) => t.estado === 'completada' || t.estado === 'en_progreso').length;
    const sesPac = (sesiones ?? []).filter((s) => s.vinculacion_id === v.id);
    const retro = (resp ?? []).filter(
      (r) => r.retroalimentacion && tareaVinc.get(r.tarea_id) === v.id,
    ).length;

    const ultima = regsPac
      .map((r) => r.fecha)
      .sort()
      .pop();
    const sinActividad = dias(ultima ? `${ultima}T00:00:00Z` : null);
    const adher = tareasPac.length ? Math.round((conProgreso / tareasPac.length) * 100) : null;

    // Semáforo: combina adherencia y actividad reciente.
    let semaforo: AdherenciaPaciente['semaforo'] = 'bien';
    if ((adher != null && adher < 40) || (sinActividad != null && sinActividad > 21) || regsPac.length === 0) {
      semaforo = 'riesgo';
    } else if ((adher != null && adher < 70) || (sinActividad != null && sinActividad > 10)) {
      semaforo = 'atencion';
    }

    return {
      vinculacionId: v.id,
      nombre: nombres.get(pid) ?? 'Paciente',
      registros30: regsPac.length,
      tareasAsignadas: tareasPac.length,
      tareasCompletadas: completadas,
      adherencia: adher,
      sesionesRealizadas: sesPac.filter((s) => s.estado === 'realizada').length,
      sesionesCanceladas: sesPac.filter((s) => s.estado === 'cancelada').length,
      notasTerapeuta: (notas ?? []).filter((n) => n.vinculacion_id === v.id).length,
      retroalimentaciones: retro,
      diasSinActividad: sinActividad,
      semaforo,
    };
  });

  const conAdher = pacientes.filter((p) => p.adherencia != null);
  const promedio = conAdher.length
    ? Math.round(conAdher.reduce((a, p) => a + (p.adherencia ?? 0), 0) / conAdher.length)
    : null;

  // Qué prácticas se asocian a mejor adherencia (comparativa dentro del terapeuta).
  const hallazgos: string[] = [];
  if (conAdher.length >= 2) {
    const altos = conAdher.filter((p) => (p.adherencia ?? 0) >= 70);
    const bajos = conAdher.filter((p) => (p.adherencia ?? 0) < 70);
    const prom = (arr: AdherenciaPaciente[], f: (p: AdherenciaPaciente) => number) =>
      arr.length ? arr.reduce((a, p) => a + f(p), 0) / arr.length : 0;
    if (altos.length && bajos.length) {
      const retroA = prom(altos, (p) => p.retroalimentaciones);
      const retroB = prom(bajos, (p) => p.retroalimentaciones);
      if (retroA > retroB * 1.3) {
        hallazgos.push(
          `Los pacientes con mejor adherencia reciben más retroalimentación a sus tareas (${retroA.toFixed(1)} vs ${retroB.toFixed(1)} en promedio).`,
        );
      }
      const sesA = prom(altos, (p) => p.sesionesRealizadas);
      const sesB = prom(bajos, (p) => p.sesionesRealizadas);
      if (sesA > sesB * 1.2) {
        hallazgos.push(
          `Mayor constancia en sesiones se asocia a mejor adherencia (${sesA.toFixed(1)} vs ${sesB.toFixed(1)} sesiones realizadas).`,
        );
      }
      const regA = prom(altos, (p) => p.registros30);
      const regB = prom(bajos, (p) => p.registros30);
      if (regA > regB * 1.3) {
        hallazgos.push(
          `Quienes registran más en la app sostienen mejor el tratamiento (${regA.toFixed(1)} vs ${regB.toFixed(1)} registros en 30 días).`,
        );
      }
      const notasA = prom(altos, (p) => p.notasTerapeuta);
      const notasB = prom(bajos, (p) => p.notasTerapeuta);
      if (notasA > notasB * 1.3) {
        hallazgos.push(
          `Los procesos con más seguimiento documentado por el terapeuta muestran mejor adherencia (${notasA.toFixed(1)} vs ${notasB.toFixed(1)} notas).`,
        );
      }
    }
  }

  return {
    nombre: miembro.terapeuta_nombre ?? 'Terapeuta',
    pacientes: pacientes.sort((a, b) => (a.adherencia ?? 0) - (b.adherencia ?? 0)),
    promedioAdherencia: promedio,
    totalPacientes: pacientes.length,
    enRiesgo: pacientes.filter((p) => p.semaforo === 'riesgo').length,
    hallazgos,
  };
}
