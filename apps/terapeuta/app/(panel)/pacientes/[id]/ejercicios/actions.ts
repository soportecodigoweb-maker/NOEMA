'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function asignarPlantillaAction(
  vinculacionId: string,
  formData: FormData,
) {
  const plantillaId = String(formData.get('plantillaId') ?? '');
  const fechaLimite = String(formData.get('fechaLimite') ?? '');
  const mensaje = String(formData.get('mensaje') ?? '').trim();

  if (!plantillaId) return { ok: false, error: 'Selecciona una plantilla.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sin sesión' };

  // Tomar datos de la plantilla
  const { data: plantilla } = await supabase
    .from('plantillas_ejercicios')
    .select('titulo, descripcion, contenido_md, categoria')
    .eq('id', plantillaId)
    .single();

  if (!plantilla) return { ok: false, error: 'Plantilla no encontrada.' };

  // Insertar tarea
  await supabase.from('tareas').insert({
    vinculacion_id: vinculacionId,
    plantilla_id: plantillaId,
    asignada_por: user.id,
    titulo: plantilla.titulo,
    descripcion: plantilla.descripcion,
    contenido_md: plantilla.contenido_md,
    fecha_limite: fechaLimite || null,
    comentarios_terapeuta: mensaje || null,
    estado: 'pendiente',
  });

  // Incrementar usos_count de la plantilla (sin RPC: leer + update)
  const { data: pl } = await supabase
    .from('plantillas_ejercicios')
    .select('usos_count')
    .eq('id', plantillaId)
    .single();
  if (pl) {
    await supabase
      .from('plantillas_ejercicios')
      .update({ usos_count: (pl.usos_count ?? 0) + 1 })
      .eq('id', plantillaId);
  }

  revalidatePath(`/pacientes/${vinculacionId}/ejercicios`);
  return { ok: true };
}
