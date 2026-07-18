'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function guardarNotasAction(vinculacionId: string, notas: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('vinculacion_notas_privadas')
    .upsert(
      {
        vinculacion_id: vinculacionId,
        contenido: notas ?? '',
        actualizado_at: new Date().toISOString(),
      },
      { onConflict: 'vinculacion_id' },
    );

  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/notas`);
  return { ok: true };
}
