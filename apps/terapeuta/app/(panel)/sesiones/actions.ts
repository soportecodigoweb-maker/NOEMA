'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cdmxALocalISO } from '@/lib/utils';

export interface AgendarResult {
  ok: boolean;
  error?: string;
}

export async function agendarSesionAction(formData: FormData): Promise<AgendarResult> {
  const vinculacionId = String(formData.get('vinculacionId') ?? '');
  const fecha = String(formData.get('fecha') ?? ''); // yyyy-mm-dd
  const hora = String(formData.get('hora') ?? ''); // HH:mm
  const duracion = Number(formData.get('duracion') ?? 60);
  const modalidad = String(formData.get('modalidad') ?? 'online');
  const link = String(formData.get('link') ?? '').trim();
  const ubicacion = String(formData.get('ubicacion') ?? '').trim();

  if (!vinculacionId || !fecha || !hora) {
    return { ok: false, error: 'Falta paciente, fecha u hora.' };
  }

  // La hora se escribe en hora de CDMX → convertir a UTC correctamente.
  const fechaProgramada = cdmxALocalISO(fecha, hora);

  const supabase = await createClient();
  const { error } = await supabase.from('sesiones').insert({
    vinculacion_id: vinculacionId,
    fecha_programada: fechaProgramada,
    duracion_min: duracion,
    modalidad: modalidad as 'online' | 'presencial' | 'hibrida',
    link_videollamada: modalidad !== 'presencial' && link ? link : null,
    ubicacion: modalidad !== 'online' && ubicacion ? ubicacion : null,
    estado: 'programada',
  });

  if (error) return { ok: false, error: 'No se pudo agendar la sesión.' };

  revalidatePath('/sesiones');
  revalidatePath(`/pacientes`);
  return { ok: true };
}

export async function cancelarSesionAction(sesionId: string): Promise<AgendarResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('sesiones')
    .update({ estado: 'cancelada' })
    .eq('id', sesionId);

  if (error) return { ok: false, error: 'No se pudo cancelar.' };
  revalidatePath('/sesiones');
  return { ok: true };
}
