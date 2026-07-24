'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Activa/desactiva el modo aprendiz (tour guiado) del usuario en sesión. */
export async function toggleModoAprendizAction(activo: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from('profiles').update({ modo_aprendiz: activo }).eq('id', user.id);
  revalidatePath('/', 'layout');
  return { ok: true };
}
