'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { NivelRiesgo } from '@/lib/riesgo';

interface Result {
  ok: boolean;
  error?: string;
}

/** Cambia el nivel de riesgo del paciente (requerimiento #8). */
export async function setNivelRiesgoAction(
  vinculacionId: string,
  nivel: NivelRiesgo,
  nota?: string,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('vinculaciones')
    .update({ nivel_riesgo: nivel, nivel_riesgo_nota: nota ?? null })
    .eq('id', vinculacionId);

  if (error) return { ok: false, error: 'No se pudo actualizar el nivel de riesgo.' };
  revalidatePath(`/pacientes/${vinculacionId}`);
  revalidatePath('/pacientes');
  return { ok: true };
}

/** Habilita/deshabilita el botón S.O.S. del paciente (requerimiento #9). */
export async function setSosHabilitadoAction(
  vinculacionId: string,
  habilitado: boolean,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('vinculaciones')
    .update({ sos_habilitado: habilitado })
    .eq('id', vinculacionId);

  if (error) return { ok: false, error: 'No se pudo actualizar el botón S.O.S.' };
  revalidatePath(`/pacientes/${vinculacionId}`);
  return { ok: true };
}

/**
 * Desvincula a un paciente: finaliza la relación terapéutica. El terapeuta deja
 * de tener acceso a la información del paciente y el paciente queda sin terapeuta
 * (sin canalizar a otro). A diferencia de canalizar, no reasigna a nadie.
 */
export async function desvincularPacienteAction(
  vinculacionId: string,
  motivo?: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const { error } = await supabase
    .from('vinculaciones')
    .update({
      estado: 'finalizada',
      fecha_fin: new Date().toISOString(),
      motivo_fin: motivo?.trim() || 'Desvinculado por el terapeuta',
    })
    .eq('id', vinculacionId)
    .eq('terapeuta_id', user.id);

  if (error) return { ok: false, error: 'No se pudo desvincular al paciente.' };
  revalidatePath('/pacientes');
  revalidatePath(`/pacientes/${vinculacionId}`);
  return { ok: true };
}

/** Habilita/deshabilita que el paciente agende citas (requerimiento #13). */
export async function setAgendaHabilitadaAction(
  vinculacionId: string,
  habilitada: boolean,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('vinculaciones')
    .update({ agenda_habilitada: habilitada })
    .eq('id', vinculacionId);

  if (error) return { ok: false, error: 'No se pudo actualizar la opción de agenda.' };
  revalidatePath(`/pacientes/${vinculacionId}`);
  return { ok: true };
}
