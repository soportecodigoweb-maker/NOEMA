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

/** El terapeuta marca como vista una observación de supervisión. */
export async function marcarObservacionVistaAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: obs } = await db
    .from('supervision_comentarios')
    .select('id, centro_id, terapeuta_id, visto_at, contexto, vinculacion_id')
    .eq('id', id)
    .maybeSingle();
  if (!obs || obs.terapeuta_id !== user.id || obs.visto_at) return { ok: false };

  await db
    .from('supervision_comentarios')
    .update({ visto_at: new Date().toISOString() })
    .eq('id', id);

  const { data: perfil } = await db
    .from('profiles')
    .select('nombre, apellidos')
    .eq('id', user.id)
    .maybeSingle();
  const nombre = [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ') || 'El terapeuta';

  await db.from('notificaciones').insert({
    destinatario_id: obs.centro_id,
    tipo: 'supervision',
    titulo: '✓ Observación revisada',
    cuerpo: obs.contexto
      ? `${nombre} revisó tu observación sobre: ${obs.contexto}.`
      : `${nombre} revisó tu observación de supervisión.`,
    url: obs.vinculacion_id
      ? `/centro/supervision/${obs.vinculacion_id}`
      : '/centro/supervision',
  });

  revalidatePath('/ajustes');
  revalidatePath('/mi-centro');
  return { ok: true };
}
