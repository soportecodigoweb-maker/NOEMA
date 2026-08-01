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
