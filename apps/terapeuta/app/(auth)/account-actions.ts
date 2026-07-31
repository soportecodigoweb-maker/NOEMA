'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * "Elimina" la cuenta del usuario en sesión con el modelo **bloquear y
 * archivar** (decisión de Javier, jul 2026):
 *
 *  1. Revoca el acceso: finaliza todas sus vinculaciones, de modo que ningún
 *     terapeuta (ni el paciente) pueda seguir accediendo a la información.
 *  2. Marca la cuenta como `eliminada` y bloquea el ingreso (ban en Auth).
 *  3. Los datos NO se borran físicamente: se conservan bloqueados por
 *     obligación legal (posibles requerimientos judiciales). Esto se declara en
 *     el aviso de privacidad.
 *
 * Se confirma escribiendo ELIMINAR (validado también aquí, no solo en cliente).
 */
export async function eliminarCuentaAction(
  confirmacion: string,
): Promise<{ ok: boolean; error?: string }> {
  if (confirmacion.trim().toUpperCase() !== 'ELIMINAR') {
    return { ok: false, error: 'Escribe ELIMINAR para confirmar.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sin sesión.' };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return { ok: false, error: 'Configuración incompleta del servidor.' };
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const ahora = new Date().toISOString();

  // 1. Revocar acceso: finalizar vinculaciones donde participa (como paciente
  //    y como terapeuta). Así ningún terapeuta puede seguir viendo sus datos.
  await admin
    .from('vinculaciones')
    .update({ estado: 'finalizada', fecha_fin: ahora, motivo_fin: 'Cuenta eliminada por el usuario' })
    .eq('paciente_id', user.id)
    .in('estado', ['activa', 'pausada', 'pendiente']);
  await admin
    .from('vinculaciones')
    .update({ estado: 'finalizada', fecha_fin: ahora, motivo_fin: 'Cuenta del terapeuta eliminada' })
    .eq('terapeuta_id', user.id)
    .in('estado', ['activa', 'pausada', 'pendiente']);

  // 2. Marcar la cuenta como eliminada (bloqueada y archivada).
  const { error: eProfile } = await admin
    .from('profiles')
    .update({ estado_cuenta: 'eliminada', eliminada_at: ahora })
    .eq('id', user.id);
  if (eProfile) {
    return { ok: false, error: 'No se pudo procesar. Intenta más tarde.' };
  }

  // 3. Bloquear el ingreso a Auth (ban ~100 años). No borramos el usuario para
  //    conservar el archivo legal; el ban impide volver a iniciar sesión.
  await admin.auth.admin.updateUserById(user.id, { ban_duration: '876600h' });

  // 4. Cerrar la sesión local actual.
  await supabase.auth.signOut();
  return { ok: true };
}
