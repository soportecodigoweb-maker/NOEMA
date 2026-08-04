'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** El dueño cambia el estado de una solicitud (abierta/en_proceso/resuelta). */
export async function cambiarEstadoSolicitudAction(
  id: string,
  estado: 'abierta' | 'en_proceso' | 'resuelta',
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: perfil } = await db.from('profiles').select('rol').eq('id', user.id).maybeSingle();
  if (perfil?.rol !== 'admin') return { ok: false };

  const { error } = await db
    .from('solicitudes_soporte')
    .update({ estado, resuelto_at: estado === 'resuelta' ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return { ok: false };
  revalidatePath('/admin/solicitudes');
  return { ok: true };
}
