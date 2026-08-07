'use server';

import { createClient } from '@/lib/supabase/server';

/** Envía la respuesta de la encuesta de satisfacción (llega al Panel de Dueño). */
export async function enviarEncuestaAction(
  calificacion: number,
  comentario: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (calificacion < 1 || calificacion > 5) return { ok: false, error: 'Elige una calificación.' };

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, apellidos, rol')
    .eq('id', user.id)
    .maybeSingle();

  const { error } = await supabase.from('encuestas_satisfaccion').insert({
    usuario_id: user.id,
    usuario_nombre: [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ') || null,
    rol: perfil?.rol ?? null,
    calificacion,
    comentario: comentario.trim() || null,
  });
  if (error) return { ok: false, error: 'No se pudo enviar. Intenta de nuevo.' };
  return { ok: true };
}
