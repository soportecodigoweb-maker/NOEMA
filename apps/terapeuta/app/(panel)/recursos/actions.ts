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
  const categoria = String(formData.get('categoria') ?? 'general').trim() || 'general';
  const contenido = String(formData.get('contenido') ?? '').trim();

  if (!titulo) return { ok: false, error: 'Ponle un título.' };

  const { data, error } = await supabase
    .from('plantillas_ejercicios')
    .insert({
      terapeuta_id: user.id,
      titulo,
      descripcion: descripcion || null,
      categoria,
      contenido_md: contenido || null,
      tipo: 'ejercicio',
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: 'No se pudo crear el recurso.' };
  revalidatePath('/recursos');
  redirect(`/recursos/${data.id}`);
}
