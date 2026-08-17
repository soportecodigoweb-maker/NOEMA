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
  // Valores editados por el terapeuta para este paciente (si vienen).
  const tituloEditado = String(formData.get('titulo') ?? '').trim();
  const descripcionEditada = String(formData.get('descripcion') ?? '').trim();
  const contenidoEditado = String(formData.get('contenido') ?? '').trim();
  // Formato tabla: el terapeuta define las columnas.
  const columnasRaw = String(formData.get('columnas') ?? '').trim();
  let tablaColumnas: { key: string; label: string }[] | null = null;
  if (columnasRaw) {
    try {
      const arr = JSON.parse(columnasRaw) as string[];
      if (Array.isArray(arr) && arr.length > 0) {
        tablaColumnas = arr.map((label, i) => ({ key: `c${i + 1}`, label: String(label) }));
      }
    } catch {
      tablaColumnas = null;
    }
  }

  if (!plantillaId) return { ok: false, error: 'Selecciona una plantilla.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sin sesión' };

  // Tomar datos de la plantilla (incluidos los campos de respuesta, para que
  // el paciente conteste cada pregunta dentro de la misma tarea — punto #8).
  const { data: plantilla } = await supabase
    .from('plantillas_ejercicios')
    .select('titulo, descripcion, contenido_md, categoria, campos_respuesta, recursos')
    .eq('id', plantillaId)
    .single();

  if (!plantilla) return { ok: false, error: 'Plantilla no encontrada.' };

  // Insertar tarea. Copiamos campos_respuesta (para que conteste cada pregunta)
  // y recursos (lecturas, PDF, audios y enlaces) para que le lleguen al paciente.
  await supabase.from('tareas').insert({
    vinculacion_id: vinculacionId,
    plantilla_id: plantillaId,
    asignada_por: user.id,
    // Usa lo que el terapeuta editó; si no editó, cae a la plantilla.
    titulo: tituloEditado || plantilla.titulo,
    descripcion: descripcionEditada || plantilla.descripcion,
    contenido_md: contenidoEditado || plantilla.contenido_md,
    campos_respuesta: plantilla.campos_respuesta ?? [],
    ...(tablaColumnas ? { tabla_columnas: tablaColumnas } : {}),
    recursos: plantilla.recursos ?? [],
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
