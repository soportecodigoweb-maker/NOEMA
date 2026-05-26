'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function guardarNotasAction(vinculacionId: string, notas: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('vinculaciones')
    .update({ notas_terapeuta_privadas: notas || null })
    .eq('id', vinculacionId);

  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/notas`);
  return { ok: true };
}
