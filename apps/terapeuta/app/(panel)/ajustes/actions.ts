'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function actualizarPerfilAction(formData: FormData) {
  const nombre = String(formData.get('nombre') ?? '').trim();
  const titulo = String(formData.get('titulo') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const especialidadesRaw = String(formData.get('especialidades') ?? '');
  const enfoquesRaw = String(formData.get('enfoques') ?? '');
  const ciudad = String(formData.get('ciudad') ?? '').trim();
  const cedula = String(formData.get('cedula') ?? '').trim();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sin sesión' };

  const [profileResult, terapeutaResult] = await Promise.all([
    supabase
      .from('profiles')
      .update({ nombre, ciudad: ciudad || null })
      .eq('id', user.id),
    supabase
      .from('terapeutas')
      .update({
        titulo,
        descripcion,
        cedula_profesional: cedula || null,
        especialidades: especialidadesRaw.split(',').map((s) => s.trim()).filter(Boolean),
        enfoques: enfoquesRaw.split(',').map((s) => s.trim()).filter(Boolean),
      })
      .eq('profile_id', user.id),
  ]);

  if (profileResult.error || terapeutaResult.error) {
    return { ok: false, error: 'No pudimos guardar.' };
  }

  revalidatePath('/ajustes');
  revalidatePath('/', 'layout'); // refrescar sidebar
  return { ok: true };
}
