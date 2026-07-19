'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function dejarRetroalimentacionAction(
  respuestaId: string,
  vinculacionId: string,
  texto: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from('tarea_respuestas')
    .update({
      retroalimentacion: texto.trim() || null,
      retroalimentacion_por: user.id,
      retroalimentacion_at: new Date().toISOString(),
    })
    .eq('id', respuestaId);

  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/ejercicios`);
  return { ok: true };
}
