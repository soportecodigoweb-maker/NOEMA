// Finanzas de la clínica: actividad real (sesiones) vs dinero registrado.
// Todo con service role, solo server.
import { createClient as createAdminClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface FilaTerapeutaFinanzas {
  terapeutaId: string;
  nombre: string;
  sesiones: number;
  tarifa: number;
  esperado: number;
  cobrado: number;
  diferencia: number;
  comisionPct: number;
  paraCentro: number;
  paraTerapeuta: number;
}

export interface FinanzasCentro {
  moneda: string;
  tarifaCentro: number;
  comisionCentro: number;
  desde: string;
  hasta: string;
  totalSesiones: number;
  totalEsperado: number;
  totalCobrado: number;
  totalDiferencia: number;
  totalParaCentro: number;
  totalParaTerapeutas: number;
  porMetodo: { metodo: string; total: number }[];
  filas: FilaTerapeutaFinanzas[];
  cobros: {
    id: string;
    fecha: string;
    monto: number;
    metodo: string;
    concepto: string | null;
    terapeuta: string;
  }[];
}

/** Reúne finanzas del mes indicado (o el actual). */
export async function finanzasCentro(centroId: string, mes?: string): Promise<FinanzasCentro> {
  const db = admin();
  const base = mes ? new Date(`${mes}-01T00:00:00`) : new Date();
  const desde = new Date(base.getFullYear(), base.getMonth(), 1);
  const hasta = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const desdeISO = desde.toISOString().slice(0, 10);
  const hastaISO = hasta.toISOString().slice(0, 10);

  const [{ data: centro }, { data: miembros }] = await Promise.all([
    db.from('centros').select('tarifa_sesion, comision_pct, moneda').eq('profile_id', centroId).maybeSingle(),
    db
      .from('centro_terapeutas')
      .select('terapeuta_id, terapeuta_nombre, tarifa_sesion, comision_pct')
      .eq('centro_id', centroId)
      .eq('estado', 'activa'),
  ]);
  const tarifaCentro = Number(centro?.tarifa_sesion ?? 0);
  const comisionCentro = Number(centro?.comision_pct ?? 0);
  const tids = (miembros ?? []).map((m) => m.terapeuta_id);

  // Sesiones REALIZADAS en el mes por terapeuta (actividad real = asistencia).
  const sesionesPorT = new Map<string, number>();
  if (tids.length) {
    const { data: vincs } = await db
      .from('vinculaciones')
      .select('id, terapeuta_id')
      .in('terapeuta_id', tids);
    const vidToT = new Map((vincs ?? []).map((v) => [v.id, v.terapeuta_id]));
    const vids = [...vidToT.keys()];
    if (vids.length) {
      const { data: ses } = await db
        .from('sesiones')
        .select('vinculacion_id, estado, fecha_programada, fecha_realizada')
        .in('vinculacion_id', vids)
        .eq('estado', 'realizada')
        .gte('fecha_programada', desde.toISOString())
        .lte('fecha_programada', new Date(hasta.getTime() + 86400000).toISOString());
      for (const s of ses ?? []) {
        const t = vidToT.get(s.vinculacion_id);
        if (t) sesionesPorT.set(t, (sesionesPorT.get(t) ?? 0) + 1);
      }
    }
  }

  // Cobros registrados por recepción en el mes.
  const { data: cobros } = await db
    .from('centro_cobros')
    .select('id, terapeuta_id, monto, metodo, concepto, fecha')
    .eq('centro_id', centroId)
    .gte('fecha', desdeISO)
    .lte('fecha', hastaISO)
    .order('fecha', { ascending: false });
  const cobradoPorT = new Map<string, number>();
  const porMetodoMap = new Map<string, number>();
  for (const c of cobros ?? []) {
    const monto = Number(c.monto);
    if (c.terapeuta_id) cobradoPorT.set(c.terapeuta_id, (cobradoPorT.get(c.terapeuta_id) ?? 0) + monto);
    porMetodoMap.set(c.metodo, (porMetodoMap.get(c.metodo) ?? 0) + monto);
  }

  const nombres = new Map((miembros ?? []).map((m) => [m.terapeuta_id, m.terapeuta_nombre ?? 'Terapeuta']));
  const filas: FilaTerapeutaFinanzas[] = (miembros ?? []).map((m) => {
    const sesiones = sesionesPorT.get(m.terapeuta_id) ?? 0;
    const tarifa = Number(m.tarifa_sesion ?? tarifaCentro);
    const comisionPct = Number(m.comision_pct ?? comisionCentro);
    const esperado = sesiones * tarifa;
    const cobrado = cobradoPorT.get(m.terapeuta_id) ?? 0;
    const paraCentro = Math.round(cobrado * (comisionPct / 100) * 100) / 100;
    return {
      terapeutaId: m.terapeuta_id,
      nombre: m.terapeuta_nombre ?? 'Terapeuta',
      sesiones,
      tarifa,
      esperado,
      cobrado,
      diferencia: Math.round((cobrado - esperado) * 100) / 100,
      comisionPct,
      paraCentro,
      paraTerapeuta: Math.round((cobrado - paraCentro) * 100) / 100,
    };
  });

  const sum = (f: (x: FilaTerapeutaFinanzas) => number) => filas.reduce((s, x) => s + f(x), 0);

  return {
    moneda: centro?.moneda ?? 'MXN',
    tarifaCentro,
    comisionCentro,
    desde: desdeISO,
    hasta: hastaISO,
    totalSesiones: sum((x) => x.sesiones),
    totalEsperado: sum((x) => x.esperado),
    totalCobrado: sum((x) => x.cobrado),
    totalDiferencia: Math.round(sum((x) => x.diferencia) * 100) / 100,
    totalParaCentro: Math.round(sum((x) => x.paraCentro) * 100) / 100,
    totalParaTerapeutas: Math.round(sum((x) => x.paraTerapeuta) * 100) / 100,
    porMetodo: [...porMetodoMap.entries()].map(([metodo, total]) => ({ metodo, total })),
    filas,
    cobros: (cobros ?? []).slice(0, 40).map((c) => ({
      id: c.id,
      fecha: c.fecha,
      monto: Number(c.monto),
      metodo: c.metodo,
      concepto: c.concepto,
      terapeuta: (c.terapeuta_id && nombres.get(c.terapeuta_id)) || '—',
    })),
  };
}
