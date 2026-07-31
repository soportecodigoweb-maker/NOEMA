'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Activa/desactiva el auto-cierre de sesión por inactividad (10 min). */
export async function toggleAutoLogoutAction(activo: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase
    .from('profiles')
    .update({ auto_logout_habilitado: activo })
    .eq('id', user.id);
  if (error) return { ok: false };
  revalidatePath('/', 'layout');
  return { ok: true };
}
