'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Json } from '@noema/database';
import { createClient } from '@/lib/supabase/server';

export async function crearPlantillaAction(formData: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const titulo = String(formData.get('titulo') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const contenido = String(formData.get('contenido') ?? '').trim();

  // Carpeta destino: recurso para pacientes vs formato de uso del terapeuta.
  const destino = String(formData.get('destino') ?? 'paciente').trim();
  const esFormatoTerapeuta = destino === 'terapeuta';
  const categoria = esFormatoTerapeuta
    ? 'formato_terapeuta'
    : String(formData.get('categoria') ?? 'general').trim() || 'general';

  // Preguntas que el paciente responderá dentro de la tarea (punto #8).
  // Llegan como JSON en el campo `campos`. Solo aplican a recursos de paciente.
  let campos: Array<{ key: string; label: string; type: string; options?: string[] }> = [];
  if (!esFormatoTerapeuta) {
    try {
      const raw = JSON.parse(String(formData.get('campos') ?? '[]'));
      if (Array.isArray(raw)) {
        campos = raw
          .filter((c) => c && typeof c.label === 'string' && c.label.trim())
          .map((c, i) => ({
            key: `p${i + 1}`,
            label: String(c.label).trim(),
            type: ['text', 'scale', 'choice'].includes(c.type) ? c.type : 'text',
            ...(c.type === 'choice' && Array.isArray(c.options)
              ? { options: c.options.map((o: unknown) => String(o).trim()).filter(Boolean) }
              : {}),
          }));
      }
    } catch {
      campos = [];
    }
  }

  if (!titulo) return { ok: false, error: 'Ponle un título.' };

  const { data, error } = await supabase
    .from('plantillas_ejercicios')
    .insert({
      terapeuta_id: user.id,
      titulo,
      descripcion: descripcion || null,
      categoria,
      contenido_md: contenido || null,
      campos_respuesta: campos,
      tipo: esFormatoTerapeuta ? 'lectura' : 'ejercicio',
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: 'No se pudo crear el recurso.' };
  revalidatePath('/recursos');
  redirect(`/recursos/${data.id}`);
}

/**
 * Normaliza y renumera las claves de los campos que llegan del editor.
 * Devuelve `Json` (jsonb en Supabase).
 */
function normalizarCampos(raw: unknown): Json {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && typeof c.label === 'string' && c.label.trim())
    .map((c, i) => ({
      key: `p${i + 1}`,
      label: String(c.label).trim(),
      type: ['text', 'scale', 'choice'].includes(c.type) ? c.type : 'text',
      required: c.required === true,
      ...(c.type === 'choice' && Array.isArray(c.options)
        ? { options: c.options.map((o: unknown) => String(o).trim()).filter(Boolean) }
        : {}),
      ...(c.type === 'scale' ? { min: 1, max: 5 } : {}),
    }));
}

/**
 * Guarda los cambios de un formulario propio del terapeuta (editor tipo
 * Google Forms). La RLS `plantillas_propias_all` impide editar las oficiales
 * de NOEMA o las de otro terapeuta — para esas se usa duplicarPlantillaAction.
 */
export async function actualizarPlantillaAction(
  id: string,
  datos: {
    titulo: string;
    descripcion: string;
    contenido: string;
    campos: unknown;
  },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const titulo = datos.titulo.trim();
  if (!titulo) return { ok: false, error: 'Ponle un título.' };

  const { error } = await supabase
    .from('plantillas_ejercicios')
    .update({
      titulo,
      descripcion: datos.descripcion.trim() || null,
      contenido_md: datos.contenido.trim() || null,
      campos_respuesta: normalizarCampos(datos.campos),
    })
    .eq('id', id)
    .eq('terapeuta_id', user.id);

  if (error) return { ok: false, error: 'No se pudo guardar.' };

  revalidatePath(`/recursos/${id}`);
  revalidatePath('/recursos');
  return { ok: true };
}

/**
 * Duplica un formulario (oficial de NOEMA o de otro terapeuta) a la biblioteca
 * propia para poder editarlo — equivalente a "Hacer una copia" de Google Forms.
 */
export async function duplicarPlantillaAction(
  id: string,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const { data: origen } = await supabase
    .from('plantillas_ejercicios')
    .select('titulo, descripcion, categoria, contenido_md, campos_respuesta, tipo, duracion_min')
    .eq('id', id)
    .maybeSingle();

  if (!origen) return { ok: false, error: 'No se encontró el formulario.' };

  const { data, error } = await supabase
    .from('plantillas_ejercicios')
    .insert({
      terapeuta_id: user.id,
      titulo: `${origen.titulo} (mi copia)`,
      descripcion: origen.descripcion,
      categoria: origen.categoria,
      contenido_md: origen.contenido_md,
      campos_respuesta: origen.campos_respuesta ?? [],
      tipo: origen.tipo,
      duracion_min: origen.duracion_min,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: 'No se pudo duplicar.' };

  revalidatePath('/recursos');
  return { ok: true, id: data.id };
}
