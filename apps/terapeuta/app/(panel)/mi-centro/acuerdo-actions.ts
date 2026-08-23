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

/** El terapeuta firma un formato/acuerdo que le envió su centro. */
export async function firmarAcuerdoCentroAction(
  id: string,
  firmaNombre: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (!firmaNombre.trim()) return { ok: false, error: 'Escribe tu nombre completo para firmar.' };

  const db = admin();
  const { data: ac } = await db
    .from('centro_acuerdos')
    .select('id, terapeuta_id, centro_id, titulo, firmado_at')
    .eq('id', id)
    .maybeSingle();
  if (!ac || ac.terapeuta_id !== user.id) return { ok: false, error: 'No puedes firmar este documento.' };
  if (ac.firmado_at) return { ok: false, error: 'Ya está firmado.' };

  const { error } = await db
    .from('centro_acuerdos')
    .update({ firmado_at: new Date().toISOString(), firma_nombre: firmaNombre.trim() })
    .eq('id', id);
  if (error) return { ok: false, error: 'No se pudo registrar tu firma.' };

  await db.from('notificaciones').insert({
    destinatario_id: ac.centro_id,
    tipo: 'centro',
    titulo: 'Un terapeuta firmó un documento',
    cuerpo: `${firmaNombre.trim()} firmó "${ac.titulo}".`,
    url: '/centro/terapeutas',
  });

  revalidatePath('/mi-centro');
  return { ok: true };
}
