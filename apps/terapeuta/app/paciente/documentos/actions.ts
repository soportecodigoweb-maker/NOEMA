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

/** El paciente firma un consentimiento informado que su terapeuta le envió. */
export async function firmarConsentimientoAction(
  id: string,
  firmaNombre: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (!firmaNombre.trim()) return { ok: false, error: 'Escribe tu nombre completo para firmar.' };

  const db = admin();

  const { data: doc } = await db
    .from('consentimientos_informados')
    .select('id, firmado_at, vinculacion_id')
    .eq('id', id)
    .maybeSingle();
  if (!doc) return { ok: false, error: 'No encontramos el documento.' };
  if (doc.firmado_at) return { ok: false, error: 'Este documento ya fue firmado.' };

  const { data: vinc } = await db
    .from('vinculaciones')
    .select('paciente_id, terapeuta_id')
    .eq('id', doc.vinculacion_id)
    .maybeSingle();
  if (!vinc || vinc.paciente_id !== user.id) {
    return { ok: false, error: 'No puedes firmar este documento.' };
  }

  const { error } = await db
    .from('consentimientos_informados')
    .update({ firmado_at: new Date().toISOString(), firma_nombre: firmaNombre.trim() })
    .eq('id', id);
  if (error) return { ok: false, error: 'No se pudo registrar tu firma. Intenta de nuevo.' };

  // Avisar al terapeuta que su paciente firmó.
  if (vinc.terapeuta_id) {
    await db.from('notificaciones').insert({
      destinatario_id: vinc.terapeuta_id,
      tipo: 'consentimiento',
      titulo: 'Tu paciente firmó un consentimiento',
      cuerpo: `${firmaNombre.trim()} firmó un consentimiento informado.`,
      vinculacion_id: doc.vinculacion_id,
      url: `/pacientes/${doc.vinculacion_id}/documentos`,
    });
  }

  revalidatePath('/paciente/documentos');
  return { ok: true };
}
