'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Transfiere un paciente (con todo su historial) a otro terapeuta registrado,
 * identificándolo por su cédula profesional. La lógica y las validaciones viven
 * en la función `transferir_paciente` de la BD (security definer).
 */
export async function transferirPacienteAction(
  vinculacionId: string,
  cedulaDestino: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  const cedula = cedulaDestino.trim();
  if (!cedula) return { ok: false, error: 'Escribe la cédula del terapeuta destino.' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('transferir_paciente', {
    p_vinculacion_id: vinculacionId,
    p_cedula_destino: cedula,
    p_motivo: motivo.trim() || undefined,
  });

  if (error) return { ok: false, error: 'No se pudo transferir. Revisa la cédula.' };

  const res = data as unknown as { ok: boolean; error?: string };
  if (!res?.ok) return { ok: false, error: res?.error ?? 'No se pudo transferir.' };

  revalidatePath('/pacientes');
  return { ok: true };
}
