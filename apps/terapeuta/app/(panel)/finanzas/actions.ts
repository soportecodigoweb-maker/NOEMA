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

type TipoMov = 'ingreso_otro' | 'gasto_fijo' | 'gasto_variable' | 'impuesto';

/** Registra un movimiento (otro ingreso, gasto fijo/variable, impuesto). */
export async function agregarMovimientoAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const tipo = String(formData.get('tipo') ?? '') as TipoMov;
  const validos: TipoMov[] = ['ingreso_otro', 'gasto_fijo', 'gasto_variable', 'impuesto'];
  if (!validos.includes(tipo)) return { ok: false, error: 'Tipo no válido.' };

  const concepto = String(formData.get('concepto') ?? '').trim();
  const monto = Number(formData.get('monto') ?? 0);
  const categoria = String(formData.get('categoria') ?? '').trim() || null;
  const fecha = String(formData.get('fecha') ?? '') || undefined;
  const recurrente = formData.get('recurrente') === 'on' || tipo === 'gasto_fijo';

  if (!concepto) return { ok: false, error: 'Escribe un concepto.' };
  if (!monto || monto <= 0) return { ok: false, error: 'Ingresa un monto válido.' };

  const { error } = await supabase.from('finanzas_movimientos').insert({
    terapeuta_id: user.id,
    tipo,
    concepto,
    monto,
    categoria,
    recurrente,
    ...(fecha ? { fecha } : {}),
  });
  if (error) return { ok: false, error: 'No se pudo guardar.' };
  revalidatePath('/finanzas');
  return { ok: true };
}

export async function eliminarMovimientoAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from('finanzas_movimientos').delete().eq('id', id).eq('terapeuta_id', user.id);
  revalidatePath('/finanzas');
  return { ok: true };
}

/** Registra un activo del negocio (equipo, mobiliario, etc.). */
export async function agregarActivoAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const nombre = String(formData.get('nombre') ?? '').trim();
  const valor = Number(formData.get('valor') ?? 0);
  const categoria = String(formData.get('categoria') ?? '').trim() || null;
  const fecha = String(formData.get('fecha_adquisicion') ?? '') || null;

  if (!nombre) return { ok: false, error: 'Escribe el nombre del activo.' };
  if (!valor || valor <= 0) return { ok: false, error: 'Ingresa un valor válido.' };

  const { error } = await supabase.from('finanzas_activos').insert({
    terapeuta_id: user.id,
    nombre,
    valor,
    categoria,
    fecha_adquisicion: fecha,
  });
  if (error) return { ok: false, error: 'No se pudo guardar.' };
  revalidatePath('/finanzas');
  return { ok: true };
}

export async function eliminarActivoAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase.from('finanzas_activos').delete().eq('id', id).eq('terapeuta_id', user.id);
  revalidatePath('/finanzas');
  return { ok: true };
}

/** Tasa de impuestos estimada (%) para proyectar la carga fiscal. */
export async function guardarTasaImpuestoAction(tasa: number): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const clamp = Math.max(0, Math.min(100, tasa));
  await supabase
    .from('finanzas_config')
    .upsert(
      { terapeuta_id: user.id, tasa_impuesto_pct: clamp, actualizado_at: new Date().toISOString() },
      { onConflict: 'terapeuta_id' },
    );
  revalidatePath('/finanzas');
  return { ok: true };
}

