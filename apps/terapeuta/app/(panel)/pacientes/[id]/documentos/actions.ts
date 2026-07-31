'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** El terapeuta envía un consentimiento informado al paciente para que lo firme. */
export async function enviarConsentimientoAction(
  vinculacionId: string,
  titulo: string,
  contenido: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (!titulo.trim() || !contenido.trim()) {
    return { ok: false, error: 'Escribe un título y el contenido del consentimiento.' };
  }

  const { error } = await supabase.from('consentimientos_informados').insert({
    vinculacion_id: vinculacionId,
    titulo: titulo.trim(),
    contenido: contenido.trim(),
    creado_por: user.id,
  });
  if (error) return { ok: false, error: 'No se pudo enviar el consentimiento.' };

  // Avisar al paciente (la campanita) con enlace a sus documentos.
  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('paciente_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (vinc?.paciente_id) {
    await admin().from('notificaciones').insert({
      destinatario_id: vinc.paciente_id,
      tipo: 'consentimiento',
      titulo: 'Tu terapeuta te envió un consentimiento',
      cuerpo: `Tienes un documento para revisar y firmar: ${titulo.trim()}.`,
      vinculacion_id: vinculacionId,
      url: '/paciente/documentos',
    });
  }

  revalidatePath(`/pacientes/${vinculacionId}/documentos`);
  return { ok: true };
}

/** Elimina un consentimiento enviado (por ejemplo, si se envió por error). */
export async function eliminarConsentimientoAction(
  id: string,
  vinculacionId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('consentimientos_informados').delete().eq('id', id);
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/documentos`);
  return { ok: true };
}
