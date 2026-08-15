// Detección de solicitudes de supervisión puntual pendientes para un terapeuta
// (service role, solo server). Se usa en el layout del panel del terapeuta.
import { createClient as createAdminClient } from '@supabase/supabase-js';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function solicitudSupervisionPendiente(
  terapeutaId: string,
): Promise<{ solicitudId: string; pacienteNombre: string; centroNombre: string } | null> {
  const db = admin();
  const { data: sol } = await db
    .from('supervision_solicitudes')
    .select('id, vinculacion_id, centro_id')
    .eq('terapeuta_id', terapeutaId)
    .eq('estado', 'pendiente')
    .order('creado_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sol) return null;

  let pacienteNombre = 'un paciente';
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('paciente_id')
    .eq('id', sol.vinculacion_id)
    .maybeSingle();
  if (vinc?.paciente_id) {
    const { data: p } = await db.from('profiles').select('nombre').eq('id', vinc.paciente_id).maybeSingle();
    pacienteNombre = p?.nombre ?? 'un paciente';
  }
  const { data: c } = await db.from('centros').select('nombre_centro').eq('profile_id', sol.centro_id).maybeSingle();

  return { solicitudId: sol.id, pacienteNombre, centroNombre: c?.nombre_centro ?? 'Tu centro' };
}
