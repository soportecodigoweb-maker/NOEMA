'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function guardarExpedienteInicialAction(
  vinculacionId: string,
  campos: {
    motivo_consulta: string;
    padecimiento_actual: string;
    antecedentes_familiares: string;
    antecedentes_personales: string;
    examen_mental: string;
    impresion_diagnostica: string;
    plan_terapeutico: string;
    pronostico: string;
  },
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from('expediente_inicial').upsert(
    {
      vinculacion_id: vinculacionId,
      ...campos,
      elaborado_por: user.id,
      actualizado_at: new Date().toISOString(),
    },
    { onConflict: 'vinculacion_id' },
  );

  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/historial`);
  return { ok: true };
}
