'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Json } from '@noema/database';
import { createClient } from '@/lib/supabase/server';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * El paciente autoriza (o rechaza) que su información se envíe a otro terapeuta.
 * Solo al aceptar se completa la transferencia y el informe llega al destino.
 */
export async function responderCanalizacionAction(
  id: string,
  acepta: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const db = admin();
  const { data: can } = await db.from('canalizaciones').select('*').eq('id', id).maybeSingle();
  if (!can || can.estado !== 'pendiente') {
    return { ok: false, error: 'Esta solicitud ya no está disponible.' };
  }
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('paciente_id')
    .eq('id', can.vinculacion_id)
    .maybeSingle();
  if (!vinc || vinc.paciente_id !== user.id) {
    return { ok: false, error: 'No puedes responder esta solicitud.' };
  }

  const ahora = new Date().toISOString();

  if (!acepta) {
    await db.from('canalizaciones').update({ estado: 'rechazada', resuelta_at: ahora }).eq('id', id);
    if (can.terapeuta_origen) {
      await db.from('notificaciones').insert({
        destinatario_id: can.terapeuta_origen,
        tipo: 'canalizacion',
        titulo: 'El paciente no autorizó la canalización',
        cuerpo: 'Tu paciente decidió no autorizar el envío de su información.',
        vinculacion_id: can.vinculacion_id,
        url: `/pacientes/${can.vinculacion_id}`,
      });
    }
    revalidatePath('/paciente');
    return { ok: true };
  }

  // Aceptar: transferir al destino y dejarle el informe.
  if (can.terapeuta_destino) {
    await db.from('vinculaciones').update({ terapeuta_id: can.terapeuta_destino }).eq('id', can.vinculacion_id);
    await db.from('resumenes_sesion').insert({
      vinculacion_id: can.vinculacion_id,
      terapeuta_id: can.terapeuta_destino,
      narrativa: can.informe,
      datos: { tipo: 'canalizacion', aceptada_por_paciente: true } as unknown as Json,
      dias: 90,
    });
    await db.from('notificaciones').insert({
      destinatario_id: can.terapeuta_destino,
      tipo: 'canalizacion',
      titulo: 'Recibiste un paciente canalizado',
      cuerpo: 'Un paciente aceptó ser canalizado contigo. Su informe está en su historial.',
      vinculacion_id: can.vinculacion_id,
      url: `/pacientes/${can.vinculacion_id}`,
    });
  }
  if (can.terapeuta_origen) {
    await db.from('notificaciones').insert({
      destinatario_id: can.terapeuta_origen,
      tipo: 'canalizacion',
      titulo: 'El paciente autorizó la canalización',
      cuerpo: 'La canalización se completó.',
      vinculacion_id: can.vinculacion_id,
      url: '/pacientes',
    });
  }
  await db.from('canalizaciones').update({ estado: 'aceptada', resuelta_at: ahora }).eq('id', id);

  revalidatePath('/paciente');
  return { ok: true };
}
