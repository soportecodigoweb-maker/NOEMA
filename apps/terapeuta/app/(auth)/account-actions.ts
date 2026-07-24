'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Elimina la cuenta del usuario en sesión (paciente o terapeuta).
 *
 * Borra el usuario de Auth con el cliente de servicio (admin); por las llaves
 * foráneas con ON DELETE CASCADE, esto arrastra su perfil y todos sus datos.
 * También cierra la sesión local.
 *
 * Es irreversible. La confirmación (escribir ELIMINAR) se valida aquí también,
 * no solo en el cliente.
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return { ok: false, error: 'Configuración incompleta del servidor.' };
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { ok: false, error: 'No se pudo eliminar la cuenta. Intenta más tarde.' };
  }

  // Cerrar la sesión local (las cookies ya no son válidas).
  await supabase.auth.signOut();
  return { ok: true };
}
