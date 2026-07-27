'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Crea una nota privada nueva para el vínculo. Devuelve su id. */
export async function crearNotaAction(
  vinculacionId: string,
  titulo: string,
  contenido: string,
): Promise<{ ok: boolean; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data, error } = await supabase
    .from('notas_privadas')
    .insert({
      vinculacion_id: vinculacionId,
      terapeuta_id: user.id,
      titulo: titulo.trim() || null,
      contenido,
    })
    .select('id')
    .single();
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/notas`);
  return { ok: true, id: data?.id };
}

/** Actualiza título/contenido de una nota (guardado automático). */
export async function actualizarNotaAction(
  id: string,
  titulo: string,
  contenido: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notas_privadas')
    .update({
      titulo: titulo.trim() || null,
      contenido,
      actualizado_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { ok: !error };
}

/** Elimina una nota privada. */
export async function eliminarNotaAction(
  id: string,
  vinculacionId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('notas_privadas').delete().eq('id', id);
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/notas`);
  return { ok: true };
}
