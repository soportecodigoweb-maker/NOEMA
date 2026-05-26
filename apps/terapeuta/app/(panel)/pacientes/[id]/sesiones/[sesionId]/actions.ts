'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function guardarNotaSesionAction(
  sesionId: string,
  vinculacionId: string,
  formData: FormData,
) {
  const contenidoPublico = String(formData.get('publico') ?? '').trim();
  const contenidoPrivado = String(formData.get('privado') ?? '').trim();
  const plan = String(formData.get('plan') ?? '').trim();
  const visiblePaciente = formData.get('visible') === 'on';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sin sesión' };

  // Upsert nota (una por sesión)
  const { data: existente } = await supabase
    .from('sesion_notas')
    .select('id')
    .eq('sesion_id', sesionId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from('sesion_notas')
      .update({
        contenido_publico: contenidoPublico || null,
        contenido_privado: contenidoPrivado || null,
        plan_proxima_sesion: plan || null,
        visible_paciente: visiblePaciente,
      })
      .eq('id', existente.id);
  } else {
    await supabase.from('sesion_notas').insert({
      sesion_id: sesionId,
      autor_id: user.id,
      contenido_publico: contenidoPublico || null,
      contenido_privado: contenidoPrivado || null,
      plan_proxima_sesion: plan || null,
      visible_paciente: visiblePaciente,
    });
  }

  revalidatePath(`/pacientes/${vinculacionId}/sesiones/${sesionId}`);
  return { ok: true };
}

export async function marcarRealizadaAction(sesionId: string, vinculacionId: string) {
  const supabase = await createClient();
  await supabase
    .from('sesiones')
    .update({
      estado: 'realizada',
      fecha_realizada: new Date().toISOString(),
    })
    .eq('id', sesionId);
  revalidatePath(`/pacientes/${vinculacionId}/sesiones/${sesionId}`);
  revalidatePath(`/pacientes/${vinculacionId}/sesiones`);
}

export async function cancelarSesionAction(sesionId: string, vinculacionId: string, motivo: string) {
  const supabase = await createClient();
  await supabase
    .from('sesiones')
    .update({
      estado: 'cancelada',
      motivo_cancelacion: motivo || null,
    })
    .eq('id', sesionId);
  revalidatePath(`/pacientes/${vinculacionId}/sesiones`);
}
