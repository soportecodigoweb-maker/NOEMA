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
