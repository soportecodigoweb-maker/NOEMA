'use server';

import { createClient } from '@/lib/supabase/server';

export type CanalSOS = 'mensaje' | 'llamada' | 'videollamada';

/**
 * Avisa al terapeuta de una activación del botón de apoyo (#4).
 *
 * Crea una `alertas_crisis` con origen 'boton_manual'. Solo se marca como
 * notificada al terapeuta si el paciente tiene el SOS habilitado en su
 * vinculación (respeta la decisión del paciente — ver RLS
 * alertas_crisis_terapeuta_notificado). El terapeuta la recibe al instante
 * porque `alertas_crisis` está publicada en Realtime (migración 00038).
 */
export async function avisarTerapeutaSOSAction(
  canal: CanalSOS,
): Promise<{ ok: boolean; notificado: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, notificado: false, error: 'Sin sesión' };

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, sos_habilitado')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  if (!vinc) {
    return { ok: false, notificado: false, error: 'No tienes un terapeuta vinculado.' };
  }

  const notificar = vinc.sos_habilitado === true;
  const contexto = `El paciente pidió apoyo desde el botón de crisis (${canal}).`;

  const { error } = await supabase.from('alertas_crisis').insert({
    paciente_id: user.id,
    vinculacion_id: vinc.id,
    origen: 'boton_manual',
    gravedad: 'alta',
    contexto,
    notificado_terapeuta: notificar,
    notificado_at: notificar ? new Date().toISOString() : null,
  });

  if (error) return { ok: false, notificado: false, error: 'No se pudo avisar.' };
  return { ok: true, notificado: notificar };
}
