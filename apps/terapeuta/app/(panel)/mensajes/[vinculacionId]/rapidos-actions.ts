'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Mensajes rápidos por paciente (#7): el terapeuta define respuestas que puede
 * enviar de inmediato tras un registro emocional (#6). vinculacion_id null = el
 * mensaje aplica a todos sus pacientes.
 */
export async function crearMensajeRapidoAction(
  vinculacionId: string,
  texto: string,
): Promise<{ ok: boolean; error?: string }> {
  const limpio = texto.trim();
  if (!limpio) return { ok: false, error: 'Escribe el mensaje.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sin sesión' };

  const { error } = await supabase.from('mensajes_rapidos').insert({
    terapeuta_id: user.id,
    vinculacion_id: vinculacionId,
    texto: limpio,
  });
  if (error) return { ok: false, error: 'No se pudo guardar.' };

  revalidatePath(`/mensajes/${vinculacionId}`);
  return { ok: true };
}

export async function eliminarMensajeRapidoAction(
  id: string,
  vinculacionId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase
    .from('mensajes_rapidos')
    .delete()
    .eq('id', id)
    .eq('terapeuta_id', user.id);

  revalidatePath(`/mensajes/${vinculacionId}`);
  return { ok: true };
}
