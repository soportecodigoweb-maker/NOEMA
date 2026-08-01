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
 * El centro reasigna a un paciente de uno de sus terapeutas a otro terapeuta del
 * mismo centro (continuidad cuando un terapeuta se va). El centro NO lee el
 * contenido: solo orquesta la reasignación; el expediente pasa al nuevo terapeuta.
 */
export async function reasignarPacienteCentroAction(
  vinculacionId: string,
  nuevoTerapeutaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const db = admin();

  // El vínculo debe existir y su terapeuta actual debe pertenecer a este centro.
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('id, terapeuta_id, paciente_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc) return { ok: false, error: 'No encontramos al paciente.' };

  const { data: actual } = await db
    .from('centro_terapeutas')
    .select('id')
    .eq('centro_id', user.id)
    .eq('terapeuta_id', vinc.terapeuta_id)
    .maybeSingle();
  if (!actual) return { ok: false, error: 'Este paciente no pertenece a un terapeuta de tu centro.' };

  // El terapeuta destino también debe pertenecer al centro y estar activo.
  const { data: destino } = await db
    .from('centro_terapeutas')
    .select('terapeuta_nombre')
    .eq('centro_id', user.id)
    .eq('terapeuta_id', nuevoTerapeutaId)
    .eq('estado', 'activa')
    .maybeSingle();
  if (!destino) return { ok: false, error: 'El terapeuta destino no pertenece a tu centro.' };
  if (nuevoTerapeutaId === vinc.terapeuta_id) {
    return { ok: false, error: 'El paciente ya está con ese terapeuta.' };
  }

  const { error } = await db
    .from('vinculaciones')
    .update({ terapeuta_id: nuevoTerapeutaId })
    .eq('id', vinculacionId);
  if (error) return { ok: false, error: 'No se pudo reasignar. Intenta de nuevo.' };

  // Avisar al nuevo terapeuta y al paciente.
  await db.from('notificaciones').insert({
    destinatario_id: nuevoTerapeutaId,
    tipo: 'centro',
    titulo: 'Se te reasignó un paciente',
    cuerpo: 'Tu centro te asignó un paciente para dar continuidad a su proceso.',
    vinculacion_id: vinculacionId,
    url: `/pacientes/${vinculacionId}`,
  });
  if (vinc.paciente_id) {
    await db.from('notificaciones').insert({
      destinatario_id: vinc.paciente_id,
      tipo: 'centro',
      titulo: 'Tu terapeuta cambió',
      cuerpo: `Tu centro asignó a ${destino.terapeuta_nombre ?? 'un nuevo terapeuta'} para continuar tu proceso.`,
      url: '/paciente',
    });
  }

  revalidatePath('/centro');
  return { ok: true };
}
