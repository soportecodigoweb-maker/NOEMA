// Carga de datos administrativos del centro (service role, solo server).
// El centro ve QUÉ pacientes tiene cada terapeuta, no el contenido de sus
// expedientes.
import { createClient as createAdminClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface TerapeutaCentro {
  terapeutaId: string;
  nombre: string;
  pacientes: { vinculacionId: string; nombre: string }[];
}

/** Estadísticas del panel del centro. */
export async function estadisticasCentro(centroId: string): Promise<{
  terapeutas: number;
  pacientesActivos: number;
  sesionesMes: number;
  canalizaciones: number;
  altas30d: number;
  bajas30d: number;
}> {
  const db = admin();
  const { data: miembros } = await db
    .from('centro_terapeutas')
    .select('terapeuta_id')
    .eq('centro_id', centroId)
    .eq('estado', 'activa');
  const tids = (miembros ?? []).map((m) => m.terapeuta_id);
  if (!tids.length) {
    return { terapeutas: 0, pacientesActivos: 0, sesionesMes: 0, canalizaciones: 0, altas30d: 0, bajas30d: 0 };
  }

  const { data: vincs } = await db
    .from('vinculaciones')
    .select('id, estado, fecha_inicio, fecha_fin')
    .in('terapeuta_id', tids);
  const v = vincs ?? [];
  const vids = v.map((x) => x.id);
  const hace30 = new Date(Date.now() - 30 * 86400000);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  let sesionesMes = 0;
  let canalizaciones = 0;
  if (vids.length) {
    const [{ count: sc }, { count: cc }] = await Promise.all([
      db
        .from('sesiones')
        .select('*', { count: 'exact', head: true })
        .in('vinculacion_id', vids)
        .gte('fecha_programada', inicioMes.toISOString()),
      db.from('canalizaciones').select('*', { count: 'exact', head: true }).in('vinculacion_id', vids),
    ]);
    sesionesMes = sc ?? 0;
    canalizaciones = cc ?? 0;
  }

  return {
    terapeutas: tids.length,
    pacientesActivos: v.filter((x) => x.estado === 'activa').length,
    sesionesMes,
    canalizaciones,
    altas30d: v.filter((x) => x.fecha_inicio && new Date(x.fecha_inicio) >= hace30).length,
    bajas30d: v.filter((x) => x.fecha_fin && new Date(x.fecha_fin) >= hace30).length,
  };
}

/** Lista de terapeutas del centro con su número de pacientes activos. */
export async function listaTerapeutasCentro(
  centroId: string,
): Promise<{ terapeutaId: string; nombre: string; pacientes: number }[]> {
  const db = admin();
  const { data: miembros } = await db
    .from('centro_terapeutas')
    .select('terapeuta_id, terapeuta_nombre')
    .eq('centro_id', centroId)
    .eq('estado', 'activa')
    .order('vinculado_at', { ascending: true });
  const tids = (miembros ?? []).map((m) => m.terapeuta_id);
  const conteo = new Map<string, number>();
  if (tids.length) {
    const { data: vincs } = await db
      .from('vinculaciones')
      .select('terapeuta_id')
      .in('terapeuta_id', tids)
      .eq('estado', 'activa');
    for (const x of vincs ?? []) conteo.set(x.terapeuta_id, (conteo.get(x.terapeuta_id) ?? 0) + 1);
  }
  return (miembros ?? []).map((m) => ({
    terapeutaId: m.terapeuta_id,
    nombre: m.terapeuta_nombre ?? 'Terapeuta',
    pacientes: conteo.get(m.terapeuta_id) ?? 0,
  }));
}

export interface DetalleTerapeuta {
  nombre: string;
  pacientes: { vinculacionId: string; nombre: string; estado: string; sesiones: number }[];
  otrosTerapeutas: { id: string; nombre: string }[];
}

/** Detalle de un terapeuta del centro: sus pacientes (info básica, no clínica). */
export async function detalleTerapeuta(
  centroId: string,
  terapeutaId: string,
): Promise<DetalleTerapeuta | null> {
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
    .select('id, paciente_id, estado')
    .eq('terapeuta_id', terapeutaId)
    .order('fecha_inicio', { ascending: false });
  const v = vincs ?? [];
  const pacIds = [...new Set(v.map((x) => x.paciente_id).filter((x): x is string => !!x))];
  const nombres = new Map<string, string>();
  if (pacIds.length) {
    const { data: profs } = await db.from('profiles').select('id, nombre').in('id', pacIds);
    for (const p of profs ?? []) nombres.set(p.id, p.nombre);
  }
  const vids = v.map((x) => x.id);
  const sesCount = new Map<string, number>();
  if (vids.length) {
    const { data: ses } = await db.from('sesiones').select('vinculacion_id').in('vinculacion_id', vids);
    for (const s of ses ?? []) sesCount.set(s.vinculacion_id, (sesCount.get(s.vinculacion_id) ?? 0) + 1);
  }

  // Otros terapeutas del centro (para reasignar).
  const { data: otros } = await db
    .from('centro_terapeutas')
    .select('terapeuta_id, terapeuta_nombre')
    .eq('centro_id', centroId)
    .eq('estado', 'activa')
    .neq('terapeuta_id', terapeutaId);

  return {
    nombre: miembro.terapeuta_nombre ?? 'Terapeuta',
    pacientes: v.map((x) => ({
      vinculacionId: x.id,
      nombre: (x.paciente_id && nombres.get(x.paciente_id)) || 'Paciente',
      estado: x.estado,
      sesiones: sesCount.get(x.id) ?? 0,
    })),
    otrosTerapeutas: (otros ?? []).map((o) => ({ id: o.terapeuta_id, nombre: o.terapeuta_nombre ?? 'Terapeuta' })),
  };
}

export async function cargarTerapeutasYPacientes(centroId: string): Promise<TerapeutaCentro[]> {
  const db = admin();
  const { data: miembros } = await db
    .from('centro_terapeutas')
    .select('terapeuta_id, terapeuta_nombre')
    .eq('centro_id', centroId)
    .eq('estado', 'activa')
    .order('vinculado_at', { ascending: true });
  const ids = (miembros ?? []).map((m) => m.terapeuta_id);
  if (!ids.length) return [];

  const { data: vincs } = await db
    .from('vinculaciones')
    .select('id, terapeuta_id, paciente_id')
    .in('terapeuta_id', ids)
    .eq('estado', 'activa');

  const pacIds = [
    ...new Set((vincs ?? []).map((v) => v.paciente_id).filter((x): x is string => !!x)),
  ];
  const nombres = new Map<string, string>();
  if (pacIds.length) {
    const { data: profs } = await db.from('profiles').select('id, nombre').in('id', pacIds);
    for (const p of profs ?? []) nombres.set(p.id, p.nombre);
  }

  return (miembros ?? []).map((m) => ({
    terapeutaId: m.terapeuta_id,
    nombre: m.terapeuta_nombre ?? 'Terapeuta',
    pacientes: (vincs ?? [])
      .filter((v) => v.terapeuta_id === m.terapeuta_id)
      .map((v) => ({
        vinculacionId: v.id,
        nombre: (v.paciente_id && nombres.get(v.paciente_id)) || 'Paciente',
      })),
  }));
}
