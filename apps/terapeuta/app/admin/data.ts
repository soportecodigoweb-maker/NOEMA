// Métricas globales para el Panel de Dueño (service role, solo server).
// El dueño ve conteos, actividad y finanzas — NUNCA el contenido de pacientes.
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@noema/database';

function admin(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const PRECIO_PACIENTE_MXN = 100;

export interface MetricasOwner {
  terapeutas: number;
  terapeutasVerificados: number;
  pacientes: number;
  centros: number;
  vincActivas: number;
  vincPendientes: number;
  vincTotal: number;
  cuentasEliminadas: number;
  nuevos7d: number;
  canalizacionesPendientes: number;
  facturables: number;
  ingresoEstimadoMXN: number;
  movimientos: { accion: string; tabla: string; rol: string | null; fecha: string }[];
  recientes: { nombre: string; rol: string; fecha: string }[];
}

async function contar(
  db: SupabaseClient<Database>,
  tabla: keyof Database['public']['Tables'],
  filtros: (q: any) => any = (q) => q,
): Promise<number> {
  const { count } = await filtros(db.from(tabla).select('*', { count: 'exact', head: true }));
  return count ?? 0;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });
}

/** Usuarios activos según su último inicio de sesión (auth). */
export async function metricasActividad(): Promise<{
  total: number;
  activos30d: number;
  activosHoy: number;
}> {
  const db = admin();
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = data?.users ?? [];
  const now = Date.now();
  const dentro = (iso: string | undefined, ms: number) =>
    !!iso && now - new Date(iso).getTime() < ms;
  return {
    total: users.length,
    activos30d: users.filter((u) => dentro(u.last_sign_in_at ?? undefined, 30 * 86400000)).length,
    activosHoy: users.filter((u) => dentro(u.last_sign_in_at ?? undefined, 86400000)).length,
  };
}

/** Uso de funciones de la app (conteos globales, sin contenido). */
export async function metricasUso(): Promise<{ label: string; valor: number }[]> {
  const db = admin();
  const c = (t: keyof Database['public']['Tables']) => contar(db, t);
  const [registros, diario, tareas, mensajes, usosPlan, sesiones, recursos] = await Promise.all([
    c('registros_emocionales'),
    c('diario_entradas'),
    c('tareas'),
    c('mensajes'),
    c('plan_apoyo_usos'),
    c('sesiones'),
    c('plan_apoyo_recursos'),
  ]);
  return [
    { label: 'Registros emocionales', valor: registros },
    { label: 'Entradas de diario', valor: diario },
    { label: 'Tareas asignadas', valor: tareas },
    { label: 'Mensajes', valor: mensajes },
    { label: 'Sesiones', valor: sesiones },
    { label: 'Usos del plan de apoyo', valor: usosPlan },
    { label: 'Recursos compartidos', valor: recursos },
  ].sort((a, b) => b.valor - a.valor);
}

/** Analítica clínica ANÓNIMA (agregada, sin nombres ni contenido). */
export async function analiticaClinica(): Promise<{
  totalRegistros: number;
  intensidadPromedio: number | null;
  topEmociones: { nombre: string; n: number }[];
  porHora: number[];
  porDia: number[];
}> {
  const db = admin();
  const { data: catalogo } = await db.from('emociones_catalogo').select('key, nombre_es');
  const nombreEmocion = new Map((catalogo ?? []).map((e) => [e.key, e.nombre_es]));

  const { data: regs } = await db
    .from('registros_emocionales')
    .select('emocion_principal_key, intensidad, hora, fecha')
    .limit(20000);
  const r = regs ?? [];

  const conteo = new Map<string, number>();
  const porHora = new Array(24).fill(0);
  const porDia = new Array(7).fill(0); // 0 = domingo
  let sumaInt = 0;
  for (const x of r) {
    conteo.set(x.emocion_principal_key, (conteo.get(x.emocion_principal_key) ?? 0) + 1);
    sumaInt += x.intensidad;
    if (x.hora) {
      const h = parseInt(String(x.hora).slice(0, 2), 10);
      if (h >= 0 && h < 24) porHora[h]++;
    }
    if (x.fecha) {
      const d = new Date(String(x.fecha) + 'T00:00:00');
      if (!Number.isNaN(d.getTime())) porDia[d.getDay()]++;
    }
  }
  const topEmociones = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, n]) => ({ nombre: nombreEmocion.get(k) ?? k, n }));

  return {
    totalRegistros: r.length,
    intensidadPromedio: r.length ? Math.round((sumaInt / r.length) * 10) / 10 : null,
    topEmociones,
    porHora,
    porDia,
  };
}

/** Totales de impacto de la plataforma. */
export async function impactoTotales(): Promise<{
  pacientesAcompanados: number;
  terapeutas: number;
  registros: number;
  sesiones: number;
  diario: number;
  mensajes: number;
}> {
  const db = admin();
  const [pacientesAcompanados, terapeutas, registros, sesiones, diario, mensajes] =
    await Promise.all([
      contar(db, 'vinculaciones', (q) => q.eq('estado', 'activa')),
      contar(db, 'profiles', (q) => q.eq('rol', 'terapeuta')),
      contar(db, 'registros_emocionales'),
      contar(db, 'sesiones', (q) => q.eq('estado', 'realizada')),
      contar(db, 'diario_entradas'),
      contar(db, 'mensajes'),
    ]);
  return { pacientesAcompanados, terapeutas, registros, sesiones, diario, mensajes };
}

export interface DatosLegales {
  totalConsentimientos: number;
  porVersion: { version: string; n: number }[];
  consentimientos: { usuario: string; tipo: string; version: string; fecha: string }[];
  eliminadas: { usuario: string; eliminada: string; purga: string }[];
}

export async function cargarLegal(): Promise<DatosLegales> {
  const db = admin();

  const [{ data: recientes }, { data: todas }, { data: elim }] = await Promise.all([
    db
      .from('consentimientos')
      .select('tipo, version, aceptado_at, profile_id')
      .order('aceptado_at', { ascending: false })
      .limit(60),
    db.from('consentimientos').select('version').limit(10000),
    db
      .from('profiles')
      .select('nombre, email, eliminada_at')
      .eq('estado_cuenta', 'eliminada')
      .order('eliminada_at', { ascending: false })
      .limit(60),
  ]);

  // Nombres/correos de quienes aceptaron (metadato legal, no contenido clínico).
  const ids = [...new Set((recientes ?? []).map((c) => c.profile_id).filter(Boolean))] as string[];
  const perfiles = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await db.from('profiles').select('id, nombre, email').in('id', ids);
    for (const p of profs ?? []) perfiles.set(p.id, p.nombre || p.email || 'Usuario');
  }

  const conteoVersion = new Map<string, number>();
  for (const c of todas ?? []) conteoVersion.set(c.version, (conteoVersion.get(c.version) ?? 0) + 1);

  const purgaDe = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    d.setFullYear(d.getFullYear() + 5);
    return d.toLocaleDateString('es-MX', { dateStyle: 'medium' });
  };

  return {
    totalConsentimientos: (todas ?? []).length,
    porVersion: [...conteoVersion.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([version, n]) => ({ version, n })),
    consentimientos: (recientes ?? []).map((c) => ({
      usuario: perfiles.get(c.profile_id) ?? 'Usuario',
      tipo: c.tipo,
      version: c.version,
      fecha: fmt(c.aceptado_at),
    })),
    eliminadas: (elim ?? []).map((e) => ({
      usuario: e.nombre || e.email || 'Usuario',
      eliminada: e.eliminada_at ? fmt(e.eliminada_at) : '—',
      purga: purgaDe(e.eliminada_at),
    })),
  };
}

export interface UsuarioOwner {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  registro: string;
  ultimoAcceso: string;
  suscripcion: string;
  estadoProceso: string;
}

/** Busca pacientes/terapeutas y devuelve info básica (sin contenido clínico). */
export async function buscarUsuarios(q: string): Promise<UsuarioOwner[]> {
  const db = admin();
  const qs = q.replace(/[,()%*]/g, ' ').trim();
  let query = db
    .from('profiles')
    .select('id, nombre, apellidos, email, rol, creado_at')
    .order('creado_at', { ascending: false })
    .limit(40);
  if (qs) query = query.or(`nombre.ilike.%${qs}%,email.ilike.%${qs}%`);
  const { data: profs } = await query;
  const list = profs ?? [];
  const ids = list.map((p) => p.id);

  const { data: au } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const lastMap = new Map((au?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]));

  const [{ data: teras }, { data: vincs }] = await Promise.all([
    ids.length
      ? db.from('terapeutas').select('profile_id, plan_estado').in('profile_id', ids)
      : Promise.resolve({ data: [] as { profile_id: string; plan_estado: string }[] }),
    ids.length
      ? db.from('vinculaciones').select('paciente_id, estado').in('paciente_id', ids)
      : Promise.resolve({ data: [] as { paciente_id: string | null; estado: string }[] }),
  ]);
  const planMap = new Map((teras ?? []).map((t) => [t.profile_id, t.plan_estado]));
  const vincMap = new Map<string, string>();
  for (const v of vincs ?? []) {
    if (v.paciente_id && !vincMap.has(v.paciente_id)) vincMap.set(v.paciente_id, v.estado);
  }

  return list.map((p) => {
    const last = lastMap.get(p.id);
    return {
      id: p.id,
      nombre: [p.nombre, p.apellidos].filter(Boolean).join(' ') || 'Sin nombre',
      email: p.email,
      rol: p.rol,
      registro: fmt(p.creado_at),
      ultimoAcceso: last ? fmt(last) : 'nunca',
      suscripcion:
        p.rol === 'terapeuta' ? (planMap.get(p.id) ?? 'sin_pago') : p.rol === 'paciente' ? 'gratis' : '—',
      estadoProceso:
        p.rol === 'paciente'
          ? vincMap.get(p.id)
            ? `Vinculación ${vincMap.get(p.id)}`
            : 'Sin terapeuta'
          : '',
    };
  });
}

export interface SolicitudOwner {
  id: string;
  tipo: string;
  asunto: string | null;
  mensaje: string;
  estado: string;
  usuario: string;
  rol: string | null;
  fecha: string;
}

export async function cargarSolicitudes(): Promise<SolicitudOwner[]> {
  const db = admin();
  const { data } = await db
    .from('solicitudes_soporte')
    .select('id, tipo, asunto, mensaje, estado, usuario_nombre, usuario_email, usuario_rol, creado_at')
    .order('creado_at', { ascending: false })
    .limit(200);
  return (data ?? []).map((s) => ({
    id: s.id,
    tipo: s.tipo,
    asunto: s.asunto,
    mensaje: s.mensaje,
    estado: s.estado,
    usuario: s.usuario_nombre || s.usuario_email || 'Usuario',
    rol: s.usuario_rol,
    fecha: fmt(s.creado_at),
  }));
}

export async function cargarMetricasOwner(): Promise<MetricasOwner> {
  const db = admin();
  const desde7 = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    terapeutas,
    terapeutasVerificados,
    pacientes,
    centros,
    vincActivas,
    vincPendientes,
    vincTotal,
    cuentasEliminadas,
    nuevos7d,
    canalizacionesPendientes,
    facturables,
  ] = await Promise.all([
    contar(db, 'profiles', (q) => q.eq('rol', 'terapeuta')),
    contar(db, 'terapeutas', (q) => q.eq('estado_verificacion', 'verificado')),
    contar(db, 'profiles', (q) => q.eq('rol', 'paciente')),
    contar(db, 'profiles', (q) => q.eq('rol', 'centro')),
    contar(db, 'vinculaciones', (q) => q.eq('estado', 'activa')),
    contar(db, 'vinculaciones', (q) => q.eq('estado', 'pendiente')),
    contar(db, 'vinculaciones', (q) => q),
    contar(db, 'profiles', (q) => q.eq('estado_cuenta', 'eliminada')),
    contar(db, 'profiles', (q) => q.gte('creado_at', desde7)),
    contar(db, 'canalizaciones', (q) => q.eq('estado', 'pendiente')),
    contar(db, 'vinculaciones', (q) => q.eq('estado', 'activa').eq('facturable', true)),
  ]);

  const { data: mov } = await db
    .from('audit_log')
    .select('accion, tabla, actor_rol, creado_at')
    .order('creado_at', { ascending: false })
    .limit(15);

  const { data: rec } = await db
    .from('profiles')
    .select('nombre, rol, creado_at')
    .order('creado_at', { ascending: false })
    .limit(10);

  return {
    terapeutas,
    terapeutasVerificados,
    pacientes,
    centros,
    vincActivas,
    vincPendientes,
    vincTotal,
    cuentasEliminadas,
    nuevos7d,
    canalizacionesPendientes,
    facturables,
    ingresoEstimadoMXN: facturables * PRECIO_PACIENTE_MXN,
    movimientos: (mov ?? []).map((m) => ({
      accion: String(m.accion),
      tabla: m.tabla,
      rol: m.actor_rol,
      fecha: fmt(m.creado_at),
    })),
    recientes: (rec ?? []).map((r) => ({
      nombre: r.nombre,
      rol: r.rol,
      fecha: fmt(r.creado_at),
    })),
  };
}
