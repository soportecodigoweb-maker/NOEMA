'use server';

import { createClient } from '@/lib/supabase/server';

export type TipoSolicitud = 'soporte' | 'duda' | 'sugerencia' | 'observacion';

/** Envía una solicitud de soporte/dudas/sugerencias al Panel de Dueño. */
export async function enviarSolicitudSoporteAction(
  tipo: TipoSolicitud,
  asunto: string,
  mensaje: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (!mensaje.trim()) return { ok: false, error: 'Escribe tu mensaje.' };

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, apellidos, email, rol')
    .eq('id', user.id)
    .maybeSingle();

  const { error } = await supabase.from('solicitudes_soporte').insert({
    usuario_id: user.id,
    usuario_email: perfil?.email ?? null,
    usuario_nombre: [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ') || null,
    usuario_rol: perfil?.rol ?? null,
    tipo,
    asunto: asunto.trim() || null,
    mensaje: mensaje.trim(),
    estado: 'abierta',
  });
  if (error) return { ok: false, error: 'No se pudo enviar. Intenta de nuevo.' };
  return { ok: true };
}
