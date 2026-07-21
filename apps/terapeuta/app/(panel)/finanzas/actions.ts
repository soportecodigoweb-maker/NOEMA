'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function registrarPagoAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const vinculacionId = String(formData.get('vinculacionId') ?? '') || null;
  const monto = Number(formData.get('monto') ?? 0);
  const concepto = String(formData.get('concepto') ?? '').trim();
  const metodo = String(formData.get('metodo') ?? 'efectivo');
  const estado = String(formData.get('estado') ?? 'pagado');
  const fecha = String(formData.get('fecha') ?? '') || undefined;

  if (!monto || monto <= 0) return { ok: false, error: 'Ingresa un monto válido.' };

  const { error } = await supabase.from('pagos_pacientes').insert({
    terapeuta_id: user.id,
    vinculacion_id: vinculacionId,
    monto,
    concepto: concepto || null,
    metodo: metodo as 'efectivo' | 'transferencia' | 'tarjeta' | 'en_linea' | 'otro',
    estado: estado as 'pagado' | 'pendiente',
    ...(fecha ? { fecha } : {}),
  });

  if (error) return { ok: false, error: 'No se pudo registrar el pago.' };
  revalidatePath('/finanzas');
  return { ok: true };
}

export async function marcarPagadoAction(pagoId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('pagos_pacientes')
    .update({ estado: 'pagado' })
    .eq('id', pagoId);
  if (error) return { ok: false };
  revalidatePath('/finanzas');
  return { ok: true };
}
