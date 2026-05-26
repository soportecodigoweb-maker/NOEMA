'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ProgramarResult {
  ok: boolean;
  error?: string;
}

export async function programarSesionAction(
  vinculacionId: string,
  formData: FormData,
): Promise<ProgramarResult> {
  const fecha = String(formData.get('fecha') ?? '');
  const hora = String(formData.get('hora') ?? '');
  const duracion = Number(formData.get('duracion') ?? 60);
  const modalidad = String(formData.get('modalidad') ?? 'online') as 'online' | 'presencial' | 'hibrida';
  const link = String(formData.get('link') ?? '').trim();
  const ubicacion = String(formData.get('ubicacion') ?? '').trim();

  if (!fecha || !hora) {
    return { ok: false, error: 'Indica fecha y hora.' };
  }

  // Construye timestamptz local
  const fechaProgramada = new Date(`${fecha}T${hora}:00`).toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from('sesiones').insert({
    vinculacion_id: vinculacionId,
    fecha_programada: fechaProgramada,
    duracion_min: duracion,
    modalidad,
    link_videollamada: modalidad !== 'presencial' && link ? link : null,
    ubicacion: modalidad !== 'online' && ubicacion ? ubicacion : null,
  });

  if (error) {
    return { ok: false, error: 'No pudimos programar la sesión.' };
  }

  revalidatePath(`/pacientes/${vinculacionId}/sesiones`);
  revalidatePath('/inicio');
  redirect(`/pacientes/${vinculacionId}/sesiones`);
}
