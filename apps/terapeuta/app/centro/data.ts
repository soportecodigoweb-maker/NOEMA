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

function unwrapNota<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
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

export interface SupervisionCentro {
  activa: boolean;
  terapeutas: {
    terapeutaId: string;
    nombre: string;
    autorizada: boolean;
    pacientes: { vinculacionId: string; nombre: string; estado: string }[];
  }[];
}

/** Datos para la sección Supervisión del centro. */
export async function datosSupervision(centroId: string): Promise<SupervisionCentro> {
  const db = admin();
  const [{ data: centro }, { data: miembros }] = await Promise.all([
    db.from('centros').select('supervision_clinica').eq('profile_id', centroId).maybeSingle(),
    db
      .from('centro_terapeutas')
      .select('terapeuta_id, terapeuta_nombre, supervision_autorizada')
      .eq('centro_id', centroId)
      .eq('estado', 'activa')
      .order('vinculado_at', { ascending: true }),
  ]);
  const tids = (miembros ?? []).map((m) => m.terapeuta_id);
  const vincByT = new Map<string, { vinculacionId: string; nombre: string; estado: string }[]>();
  if (tids.length) {
    const { data: vincs } = await db
      .from('vinculaciones')
      .select('id, terapeuta_id, paciente_id, estado')
      .in('terapeuta_id', tids)
      .eq('estado', 'activa');
    const pacIds = [...new Set((vincs ?? []).map((v) => v.paciente_id).filter((x): x is string => !!x))];
    const nombres = new Map<string, string>();
    if (pacIds.length) {
      const { data: profs } = await db.from('profiles').select('id, nombre').in('id', pacIds);
      for (const p of profs ?? []) nombres.set(p.id, p.nombre);
    }
    for (const v of vincs ?? []) {
      const arr = vincByT.get(v.terapeuta_id) ?? [];
      arr.push({
        vinculacionId: v.id,
        nombre: (v.paciente_id && nombres.get(v.paciente_id)) || 'Paciente',
        estado: v.estado,
      });
      vincByT.set(v.terapeuta_id, arr);
    }
  }
  return {
    activa: centro?.supervision_clinica ?? false,
    terapeutas: (miembros ?? []).map((m) => ({
      terapeutaId: m.terapeuta_id,
      nombre: m.terapeuta_nombre ?? 'Terapeuta',
      autorizada: m.supervision_autorizada,
      pacientes: vincByT.get(m.terapeuta_id) ?? [],
    })),
  };
}

export interface ProcesoSupervision {
  permitido: true;
  pacienteNombre: string;
  terapeutaId: string;
  terapeutaNombre: string;
  registros: { total: number; promedio: number | null; top: string; recientes: string[] };
  tareas: { total: number; completadas: number; titulos: string[] };
  notas: { objetivos: string[]; plan: string | null; observaciones: string[] };
}

/** Verifica el acceso y reúne el proceso del paciente para supervisión. */
export async function procesoSupervision(
  centroId: string,
  vinculacionId: string,
): Promise<
  | ProcesoSupervision
  | { permitido: false; terapeutaId: string; terapeutaNombre: string; solicitudPendiente: boolean }
  | null
> {
  const db = admin();
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('id, terapeuta_id, paciente_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc) return null;

  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('terapeuta_nombre, supervision_autorizada')
    .eq('centro_id', centroId)
    .eq('terapeuta_id', vinc.terapeuta_id)
    .maybeSingle();
  if (!ct) return null;
  const terapeutaNombre = ct.terapeuta_nombre ?? 'Terapeuta';

  const { data: centro } = await db
    .from('centros')
    .select('supervision_clinica')
    .eq('profile_id', centroId)
    .maybeSingle();

  let permitido = !!(centro?.supervision_clinica && ct.supervision_autorizada);
  if (!permitido) {
    const { data: sol } = await db
      .from('supervision_solicitudes')
      .select('expira_at')
      .eq('vinculacion_id', vinculacionId)
      .eq('estado', 'autorizada')
      .order('creado_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sol?.expira_at && new Date(sol.expira_at) > new Date()) permitido = true;
  }
  if (!permitido) {
    const { data: pend } = await db
      .from('supervision_solicitudes')
      .select('id')
      .eq('vinculacion_id', vinculacionId)
      .eq('estado', 'pendiente')
      .limit(1)
      .maybeSingle();
    return {
      permitido: false,
      terapeutaId: vinc.terapeuta_id,
      terapeutaNombre,
      solicitudPendiente: !!pend,
    };
  }

  const desde = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const [{ data: pac }, { data: catalogo }, { data: regs }, { data: tareas }, { data: sesiones }] =
    await Promise.all([
      db.from('profiles').select('nombre').eq('id', vinc.paciente_id ?? '').maybeSingle(),
      db.from('emociones_catalogo').select('key, nombre_es'),
      db
        .from('registros_emocionales')
        .select('emocion_principal_key, intensidad, situacion_detonante, fecha, privacidad')
        .eq('paciente_id', vinc.paciente_id ?? '')
        .in('privacidad', ['compartido', 'marcado_sesion'])
        .gte('fecha', desde)
        .order('fecha', { ascending: false })
        .limit(60),
      db.from('tareas').select('titulo, estado').eq('vinculacion_id', vinculacionId).limit(60),
      db
        .from('sesiones')
        .select('nota:sesion_notas(objetivos_trabajados, contenido_publico, plan_proxima_sesion)')
        .eq('vinculacion_id', vinculacionId)
        .eq('estado', 'realizada')
        .order('fecha_programada', { ascending: false })
        .limit(8),
    ]);

  const nombreEmocion = new Map((catalogo ?? []).map((e) => [e.key, e.nombre_es]));
  const r = regs ?? [];
  const prom = r.length ? Math.round((r.reduce((s, x) => s + x.intensidad, 0) / r.length) * 10) / 10 : null;
  const conteo = new Map<string, number>();
  for (const x of r) conteo.set(x.emocion_principal_key, (conteo.get(x.emocion_principal_key) ?? 0) + 1);
  const top = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, n]) => `${nombreEmocion.get(k) ?? k} (${n})`)
    .join(', ');
  const recientes = r
    .slice(0, 8)
    .map(
      (x) =>
        `${nombreEmocion.get(x.emocion_principal_key) ?? x.emocion_principal_key} (${x.intensidad}/5)${x.situacion_detonante ? ` — ${x.situacion_detonante}` : ''}`,
    );

  const t = tareas ?? [];
  const objetivosSet = new Set<string>();
  const observaciones: string[] = [];
  let plan: string | null = null;
  for (const s of sesiones ?? []) {
    const nota = unwrapNota(s.nota) as
      | { objetivos_trabajados?: string[]; contenido_publico?: string | null; plan_proxima_sesion?: string | null }
      | null;
    for (const o of nota?.objetivos_trabajados ?? []) objetivosSet.add(o);
    if (nota?.contenido_publico) observaciones.push(nota.contenido_publico);
    if (!plan && nota?.plan_proxima_sesion) plan = nota.plan_proxima_sesion;
  }

  return {
    permitido: true,
    pacienteNombre: pac?.nombre ?? 'Paciente',
    terapeutaId: vinc.terapeuta_id,
    terapeutaNombre,
    registros: { total: r.length, promedio: prom, top: top || 'sin datos', recientes },
    tareas: { total: t.length, completadas: t.filter((x) => x.estado === 'completada').length, titulos: t.slice(0, 8).map((x) => x.titulo) },
    notas: { objetivos: [...objetivosSet], plan, observaciones: observaciones.slice(0, 5) },
  };
}

export interface DetalleTerapeuta {
  nombre: string;
  estado: string;
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
    .select('terapeuta_nombre, estado')
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
    estado: miembro.estado,
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
