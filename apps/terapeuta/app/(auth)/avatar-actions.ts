'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Guarda la URL de la foto de perfil del usuario en sesión. */
export async function guardarAvatarUrlAction(url: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', user.id);

  if (error) return { ok: false };
  revalidatePath('/', 'layout');
  return { ok: true };
}
