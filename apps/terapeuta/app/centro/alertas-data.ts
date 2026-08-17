// Indicadores objetivos de desempeño por terapeuta y alertas por caso.
// NO usa contenido clínico: solo señales de actividad y adherencia.
import { createClient as createAdminClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface IndicadorTerapeuta {
  terapeutaId: string;
  nombre: string;
  pacientes: number;
  sesionesRealizadas: number;
  sesionesCanceladas: number;
  tareasAsignadas: number;
  tareasCompletadas: number;
  adherencia: number | null; // % de tareas completadas
  notasAlDia: number; // % de sesiones realizadas con nota
  puntaje: number; // 0-100
  semaforo: 'bien' | 'atencion' | 'riesgo';
  alertas: string[];
}

export interface AlertaCaso {
  vinculacionId: string;
  paciente: string;
  terapeuta: string;
  motivo: string;
  severidad: 'alta' | 'media';
}

export interface DatosAlertas {
  indicadores: IndicadorTerapeuta[];
  casos: AlertaCaso[];
}

const DIAS = 60;

export async function datosAlertas(centroId: string): Promise<DatosAlertas> {
  const db = admin();
  const desde = new Date(Date.now() - DIAS * 86400000);
  const desdeISO = desde.toISOString();

  const { data: miembros } = await db
    .from('centro_terapeutas')
    .select('terapeuta_id, terapeuta_nombre')
    .eq('centro_id', centroId)
    .eq('estado', 'activa');
  const tids = (miembros ?? []).map((m) => m.terapeuta_id);
  if (!tids.length) return { indicadores: [], casos: [] };

  const { data: vincs } = await db
    .from('vinculaciones')
    .select('id, terapeuta_id, paciente_id, estado')
    .in('terapeuta_id', tids);
  const activas = (vincs ?? []).filter((v) => v.estado === 'activa');
  const vidToT = new Map((vincs ?? []).map((v) => [v.id, v.terapeuta_id]));
  const vids = (vincs ?? []).map((v) => v.id);

  const nombresPac = new Map<string, string>();
  const pacIds = [...new Set(activas.map((v) => v.paciente_id).filter((x): x is string => !!x))];
  if (pacIds.length) {
    const { data: profs } = await db.from('profiles').select('id, nombre').in('id', pacIds);
    for (const p of profs ?? []) nombresPac.set(p.id, p.nombre);
  }

  // Sesiones, tareas, notas y registros del periodo.
  const [sesRes, tareasRes, regsRes] = await Promise.all([
    vids.length
      ? db
          .from('sesiones')
          .select('id, vinculacion_id, estado, fecha_programada, nota:sesion_notas(id)')
          .in('vinculacion_id', vids)
          .gte('fecha_programada', desdeISO)
      : Promise.resolve({ data: [] as any[] }),
    vids.length
      ? db.from('tareas').select('vinculacion_id, estado, creado_at').in('vinculacion_id', vids).gte('creado_at', desdeISO)
      : Promise.resolve({ data: [] as any[] }),
    pacIds.length
      ? db
          .from('registros_emocionales')
          .select('paciente_id, creado_at')
          .in('paciente_id', pacIds)
          .gte('creado_at', desdeISO)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const acc = new Map<
    string,
    { real: number; canc: number; conNota: number; tAsig: number; tComp: number }
  >();
  for (const t of tids) acc.set(t, { real: 0, canc: 0, conNota: 0, tAsig: 0, tComp: 0 });

  const ultSesionPorVinc = new Map<string, string>();
  for (const s of (sesRes.data ?? []) as any[]) {
    const t = vidToT.get(s.vinculacion_id);
    if (!t) continue;
    const a = acc.get(t)!;
    if (s.estado === 'realizada') {
      a.real++;
      const nota = Array.isArray(s.nota) ? s.nota[0] : s.nota;
      if (nota) a.conNota++;
      const prev = ultSesionPorVinc.get(s.vinculacion_id);
      if (!prev || s.fecha_programada > prev) ultSesionPorVinc.set(s.vinculacion_id, s.fecha_programada);
    } else if (s.estado === 'cancelada') {
      a.canc++;
    }
  }
  const tareasPorVinc = new Map<string, { asig: number; comp: number }>();
  for (const t of (tareasRes.data ?? []) as any[]) {
    const ter = vidToT.get(t.vinculacion_id);
    const v = tareasPorVinc.get(t.vinculacion_id) ?? { asig: 0, comp: 0 };
    v.asig++;
    if (t.estado === 'completada') v.comp++;
    tareasPorVinc.set(t.vinculacion_id, v);
    if (ter) {
      const a = acc.get(ter)!;
      a.tAsig++;
      if (t.estado === 'completada') a.tComp++;
    }
  }
  const regsPorPac = new Map<string, number>();
  for (const r of (regsRes.data ?? []) as any[]) {
    regsPorPac.set(r.paciente_id, (regsPorPac.get(r.paciente_id) ?? 0) + 1);
  }

  // Indicadores por terapeuta.
  const pacientesPorT = new Map<string, number>();
  for (const v of activas) pacientesPorT.set(v.terapeuta_id, (pacientesPorT.get(v.terapeuta_id) ?? 0) + 1);

  const indicadores: IndicadorTerapeuta[] = (miembros ?? []).map((m) => {
    const a = acc.get(m.terapeuta_id)!;
    const pacientes = pacientesPorT.get(m.terapeuta_id) ?? 0;
    const adherencia = a.tAsig > 0 ? Math.round((a.tComp / a.tAsig) * 100) : null;
    const notasAlDia = a.real > 0 ? Math.round((a.conNota / a.real) * 100) : 100;
    const totalSes = a.real + a.canc;
    const tasaCancel = totalSes > 0 ? a.canc / totalSes : 0;

    // Puntaje 0-100: adherencia (40) + notas al día (30) + baja cancelación (30).
    const pAdh = adherencia != null ? (adherencia / 100) * 40 : 28; // sin datos: neutro
    const pNotas = (notasAlDia / 100) * 30;
    const pCancel = (1 - Math.min(tasaCancel, 1)) * 30;
    const puntaje = Math.round(pAdh + pNotas + pCancel);

    const alertas: string[] = [];
    if (pacientes > 0 && a.real === 0) alertas.push('Sin sesiones realizadas en el periodo');
    if (adherencia != null && adherencia < 40) alertas.push(`Adherencia baja (${adherencia}%)`);
    if (a.real > 0 && notasAlDia < 60) alertas.push(`Notas clínicas incompletas (${notasAlDia}%)`);
    if (tasaCancel > 0.3) alertas.push(`Alta cancelación (${Math.round(tasaCancel * 100)}%)`);
    if (pacientes > 0 && a.tAsig === 0) alertas.push('No ha asignado tareas');

    const semaforo: IndicadorTerapeuta['semaforo'] =
      puntaje >= 75 && alertas.length === 0 ? 'bien' : puntaje >= 55 ? 'atencion' : 'riesgo';

    return {
      terapeutaId: m.terapeuta_id,
      nombre: m.terapeuta_nombre ?? 'Terapeuta',
      pacientes,
      sesionesRealizadas: a.real,
      sesionesCanceladas: a.canc,
      tareasAsignadas: a.tAsig,
      tareasCompletadas: a.tComp,
      adherencia,
      notasAlDia,
      puntaje,
      semaforo,
      alertas,
    };
  });

  // Alertas por caso (paciente concreto).
  const nombresT = new Map((miembros ?? []).map((m) => [m.terapeuta_id, m.terapeuta_nombre ?? 'Terapeuta']));
  const casos: AlertaCaso[] = [];
  const hace30 = Date.now() - 30 * 86400000;
  for (const v of activas) {
    const terapeuta = nombresT.get(v.terapeuta_id) ?? 'Terapeuta';
    const paciente = (v.paciente_id && nombresPac.get(v.paciente_id)) || 'Paciente';
    const ult = ultSesionPorVinc.get(v.id);
    if (!ult) {
      casos.push({ vinculacionId: v.id, paciente, terapeuta, motivo: 'Sin sesiones en 60 días', severidad: 'alta' });
    } else if (new Date(ult).getTime() < hace30) {
      casos.push({ vinculacionId: v.id, paciente, terapeuta, motivo: 'Última sesión hace más de 30 días', severidad: 'media' });
    }
    const regs = (v.paciente_id && regsPorPac.get(v.paciente_id)) ?? 0;
    if (regs === 0) {
      casos.push({ vinculacionId: v.id, paciente, terapeuta, motivo: 'Paciente sin actividad registrada', severidad: 'media' });
    }
    const tt = tareasPorVinc.get(v.id);
    if (tt && tt.asig >= 3 && tt.comp === 0) {
      casos.push({ vinculacionId: v.id, paciente, terapeuta, motivo: 'No completa ninguna tarea', severidad: 'media' });
    }
  }

  casos.sort((a, b) => (a.severidad === b.severidad ? 0 : a.severidad === 'alta' ? -1 : 1));
  indicadores.sort((a, b) => a.puntaje - b.puntaje);

  return { indicadores, casos: casos.slice(0, 40) };
}
