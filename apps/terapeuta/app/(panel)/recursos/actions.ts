'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
