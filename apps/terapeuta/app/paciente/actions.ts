'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type Privacidad = 'privado' | 'compartido' | 'marcado_sesion';

/** Crea un registro emocional del paciente. */
export async function crearRegistroAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const emocion = String(formData.get('emocion') ?? '');
  const intensidad = Number(formData.get('intensidad') ?? 3);
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const situacion = String(formData.get('situacion') ?? '').trim();
  const privacidad = String(formData.get('privacidad') ?? 'privado') as Privacidad;

  if (!emocion) return { ok: false, error: 'Elige una emoción.' };

  const { error } = await supabase.from('registros_emocionales').insert({
    paciente_id: user.id,
    emocion_principal_key: emocion,
    intensidad,
    descripcion: descripcion || null,
    situacion_detonante: situacion || null,
    privacidad,
  });

  if (error) return { ok: false, error: 'No se pudo guardar el registro.' };
  revalidatePath('/paciente/registros');
  revalidatePath('/paciente/progreso');
  return { ok: true };
}

/** Crea una entrada de diario. */
export async function crearDiarioAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const titulo = String(formData.get('titulo') ?? '').trim();
  const contenido = String(formData.get('contenido') ?? '').trim();
  const privacidad = String(formData.get('privacidad') ?? 'privado') as Privacidad;

  if (!contenido) return { ok: false, error: 'Escribe algo en tu diario.' };

  const { error } = await supabase.from('diario_entradas').insert({
    paciente_id: user.id,
    titulo: titulo || null,
    contenido,
    privacidad,
  });

  if (error) return { ok: false, error: 'No se pudo guardar.' };
  revalidatePath('/paciente/diario');
  return { ok: true };
}

/** Crea una meta/recordatorio personal. */
export async function crearMetaAction(titulo: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !titulo.trim()) return { ok: false };

  const { error } = await supabase.from('recordatorios_personales').insert({
    paciente_id: user.id,
    titulo: titulo.trim(),
  });
  if (error) return { ok: false };
  revalidatePath('/paciente/metas');
  return { ok: true };
}

export async function toggleMetaAction(id: string, completado: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recordatorios_personales')
    .update({ completado, completado_at: completado ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return { ok: false };
  revalidatePath('/paciente/metas');
  return { ok: true };
}

export async function eliminarMetaAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('recordatorios_personales').delete().eq('id', id);
  if (error) return { ok: false };
  revalidatePath('/paciente/metas');
  return { ok: true };
}

/** Responde una tarea (con campos dinámicos). */
export async function responderTareaAction(
  tareaId: string,
  respuestas: Record<string, string | number>,
  textoLibre: string,
  dificultad: number,
  compartir: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from('tarea_respuestas').insert({
    tarea_id: tareaId,
    paciente_id: user.id,
    respuestas,
    texto_libre: textoLibre || null,
    dificultad_percibida: dificultad,
    compartir_terapeuta: compartir,
  });
  if (error) return { ok: false };

  await supabase.from('tareas').update({ estado: 'en_progreso' }).eq('id', tareaId).eq('estado', 'pendiente');
  revalidatePath('/paciente/tareas');
  return { ok: true };
}
