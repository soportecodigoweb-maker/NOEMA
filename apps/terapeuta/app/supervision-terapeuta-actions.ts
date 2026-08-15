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

/**
 * El terapeuta autoriza (o no) la supervisión clínica GENERAL de su centro.
 * Al autorizar, el centro podrá ver la información de sus pacientes cuando lo
 * necesite (con registro de cada acceso).
 */
export async function autorizarSupervisionGeneralAction(
  centroId: string,
  autoriza: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  if (!autoriza) return { ok: true }; // "Ahora no": no cambia nada.

  const db = admin();
  const { error } = await db
    .from('centro_terapeutas')
    .update({ supervision_autorizada: true, supervision_autorizada_at: new Date().toISOString() })
    .eq('centro_id', centroId)
    .eq('terapeuta_id', user.id);
  if (error) return { ok: false };

  await db.from('notificaciones').insert({
    destinatario_id: centroId,
    tipo: 'supervision',
    titulo: 'Un terapeuta autorizó la supervisión',
    cuerpo: 'Ya puedes acceder a la información de sus pacientes para supervisión clínica.',
    url: '/centro/terapeutas',
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}
