'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface PerfilResult {
  ok: boolean;
  error?: string;
}

export async function completarPerfilAction(formData: FormData): Promise<PerfilResult> {
  const titulo = String(formData.get('titulo') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const cedula = String(formData.get('cedula') ?? '').trim();
  const ciudad = String(formData.get('ciudad') ?? '').trim();
  const especialidadesRaw = String(formData.get('especialidades') ?? '').trim();
  const enfoquesRaw = String(formData.get('enfoques') ?? '').trim();
  const modalidadesRaw = formData.getAll('modalidades') as string[];

  if (!titulo || !descripcion) {
    return { ok: false, error: 'Tu título y descripción son necesarios para continuar.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sesión expirada.' };

  const especialidades = especialidadesRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const enfoques = enfoquesRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const modalidades = modalidadesRaw.length > 0 ? modalidadesRaw : ['online'];

  // Upsert en terapeutas
  const { error: tErr } = await supabase
    .from('terapeutas')
    .upsert({
      profile_id: user.id,
      titulo,
      descripcion,
      cedula_profesional: cedula || null,
      especialidades,
      enfoques,
      modalidades: modalidades as Array<'presencial' | 'online' | 'hibrida'>,
      estado_verificacion: 'en_revision',
    }, { onConflict: 'profile_id' });

  if (tErr) return { ok: false, error: 'No pudimos guardar tu perfil.' };

  // Actualizar ciudad y marcar onboarding completo
  await supabase
    .from('profiles')
    .update({
      ciudad: ciudad || null,
      onboarding_completo: true,
    })
    .eq('id', user.id);

  revalidatePath('/', 'layout');
  redirect('/inicio');
}
