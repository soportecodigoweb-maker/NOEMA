'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function enviarMensajeAction(vinculacionId: string, contenido: string) {
  const texto = contenido.trim();
  if (!texto) return { ok: false };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from('mensajes').insert({
    vinculacion_id: vinculacionId,
    autor_id: user.id,
    contenido: texto,
  });

  revalidatePath(`/mensajes/${vinculacionId}`);
  revalidatePath('/mensajes');
  return { ok: true };
}

export async function marcarLeidosAction(vinculacionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('mensajes')
    .update({ leido_at: new Date().toISOString() })
    .eq('vinculacion_id', vinculacionId)
    .is('leido_at', null)
    .neq('autor_id', user.id);
}
