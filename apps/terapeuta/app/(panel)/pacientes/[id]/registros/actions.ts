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

/**
 * El terapeuta deja (o edita) una retroalimentación a un registro emocional del
 * paciente. Verifica que el registro sea de un paciente vinculado a él y avisa
 * al paciente. Pasar texto vacío borra la retroalimentación.
 */
export async function retroalimentarRegistroAction(
  registroId: string,
  vinculacionId: string,
  texto: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const db = admin();

  // El registro debe pertenecer al paciente de una vinculación de ESTE terapeuta.
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('paciente_id, terapeuta_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc || vinc.terapeuta_id !== user.id) return { ok: false, error: 'Sin permiso.' };

  const { data: reg } = await db
    .from('registros_emocionales')
    .select('id, paciente_id')
    .eq('id', registroId)
    .maybeSingle();
  if (!reg || reg.paciente_id !== vinc.paciente_id) {
    return { ok: false, error: 'Registro no encontrado.' };
  }

  const limpio = texto.trim();
  const { error } = await db
    .from('registros_emocionales')
    .update({
      retroalimentacion: limpio || null,
      retroalimentacion_at: limpio ? new Date().toISOString() : null,
      retroalimentacion_por: limpio ? user.id : null,
    })
    .eq('id', registroId);
  if (error) return { ok: false, error: 'No se pudo guardar. Intenta de nuevo.' };

  // Aviso al paciente (solo cuando hay texto).
  if (limpio) {
    const { data: perfil } = await db
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle();
    await db.from('notificaciones').insert({
      destinatario_id: vinc.paciente_id,
      tipo: 'registro',
      titulo: 'Tu terapeuta respondió a un registro',
      cuerpo: `${perfil?.nombre ?? 'Tu terapeuta'} te dejó un mensaje sobre uno de tus registros emocionales.`,
      url: '/paciente/registros',
    });
  }

  revalidatePath(`/pacientes/${vinculacionId}/registros`);
  return { ok: true };
}
