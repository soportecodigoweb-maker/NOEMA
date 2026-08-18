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

/** El terapeuta responde a su centro en el chat 1 a 1. */
export async function responderCentroAction(cuerpo: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (!cuerpo.trim()) return { ok: false };

  const db = admin();
  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('centro_id')
    .eq('terapeuta_id', user.id)
    .in('estado', ['activa', 'por_confirmar'])
    .maybeSingle();
  if (!ct) return { ok: false, error: 'No perteneces a un centro.' };

  const { error } = await db.from('centro_mensajes').insert({
    centro_id: ct.centro_id,
    terapeuta_id: user.id,
    autor_id: user.id,
    de_centro: false,
    cuerpo: cuerpo.trim(),
  });
  if (error) return { ok: false, error: 'No se pudo enviar.' };

  const { data: perfil } = await db
    .from('profiles')
    .select('nombre, apellidos')
    .eq('id', user.id)
    .maybeSingle();
  const nombre = [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ') || 'Un terapeuta';

  await db.from('notificaciones').insert({
    destinatario_id: ct.centro_id,
    tipo: 'centro',
    titulo: `Mensaje de ${nombre}`,
    cuerpo: cuerpo.trim().slice(0, 160),
    url: `/centro/comunicacion?t=${user.id}`,
  });

  revalidatePath('/mi-centro');
  return { ok: true };
}

/** Marca como leídos los mensajes que el centro le envió. */
export async function marcarLeidosCentroAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await admin()
    .from('centro_mensajes')
    .update({ leido_at: new Date().toISOString() })
    .eq('terapeuta_id', user.id)
    .eq('de_centro', true)
    .is('leido_at', null);
}
