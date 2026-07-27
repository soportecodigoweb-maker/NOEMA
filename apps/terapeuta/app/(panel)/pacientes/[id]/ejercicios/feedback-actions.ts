'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function dejarRetroalimentacionAction(
  respuestaId: string,
  vinculacionId: string,
  texto: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from('tarea_respuestas')
    .update({
      retroalimentacion: texto.trim() || null,
      retroalimentacion_por: user.id,
      retroalimentacion_at: new Date().toISOString(),
    })
    .eq('id', respuestaId);

  if (error) return { ok: false };

  // Notificar al PACIENTE que su terapeuta comentó su tarea (solo si hay texto).
  if (texto.trim()) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const urlAdmin = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceKey && urlAdmin) {
      const admin = createAdminClient(urlAdmin, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: resp } = await admin
        .from('tarea_respuestas')
        .select('paciente_id, tarea:tareas(titulo)')
        .eq('id', respuestaId)
        .maybeSingle();
      const pacienteId = (resp as { paciente_id?: string } | null)?.paciente_id;
      const tareaRel = (resp as { tarea?: { titulo?: string } | { titulo?: string }[] } | null)?.tarea;
      const tituloTarea = Array.isArray(tareaRel) ? tareaRel[0]?.titulo : tareaRel?.titulo;
      if (pacienteId) {
        await admin.from('notificaciones').insert({
          destinatario_id: pacienteId,
          tipo: 'retroalimentacion',
          titulo: 'Tu terapeuta comentó tu tarea',
          cuerpo: tituloTarea
            ? `Dejó retroalimentación en "${tituloTarea}".`
            : 'Dejó retroalimentación en una de tus tareas.',
          vinculacion_id: vinculacionId,
          url: '/paciente/tareas',
        });
      }
    }
  }

  revalidatePath(`/pacientes/${vinculacionId}/ejercicios`);
  return { ok: true };
}
