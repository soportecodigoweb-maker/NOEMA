'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function centroActual(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await admin().from('profiles').select('rol').eq('id', user.id).maybeSingle();
  return data?.rol === 'centro' ? user.id : null;
}

/** Configura la tarifa por sesión y la comisión del centro. */
export async function guardarConfigFinancieraAction(
  tarifa: number,
  comision: number,
): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId) return { ok: false };
  const { error } = await admin()
    .from('centros')
    .update({
      tarifa_sesion: Number.isFinite(tarifa) && tarifa >= 0 ? tarifa : 0,
      comision_pct: Number.isFinite(comision) && comision >= 0 && comision <= 100 ? comision : 0,
    })
    .eq('profile_id', centroId);
  if (error) return { ok: false };
  revalidatePath('/centro/finanzas');
  return { ok: true };
}

/** Tarifa/comisión específicas de un terapeuta (null = usar las del centro). */
export async function guardarTarifaTerapeutaAction(
  terapeutaId: string,
  tarifa: number | null,
  comision: number | null,
): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId) return { ok: false };
  const { error } = await admin()
    .from('centro_terapeutas')
    .update({ tarifa_sesion: tarifa, comision_pct: comision })
    .eq('centro_id', centroId)
    .eq('terapeuta_id', terapeutaId);
  if (error) return { ok: false };
  revalidatePath('/centro/finanzas');
  return { ok: true };
}

/** Recepción registra un cobro (dinero recibido). */
export async function registrarCobroAction(
  terapeutaId: string,
  monto: number,
  metodo: string,
  concepto: string,
  fecha: string,
): Promise<{ ok: boolean; error?: string }> {
  const centroId = await centroActual();
  if (!centroId) return { ok: false, error: 'Sin permiso.' };
  if (!Number.isFinite(monto) || monto <= 0) return { ok: false, error: 'Escribe un monto válido.' };

  const { error } = await admin().from('centro_cobros').insert({
    centro_id: centroId,
    terapeuta_id: terapeutaId || null,
    monto,
    metodo: ['efectivo', 'tarjeta', 'transferencia', 'otro'].includes(metodo) ? metodo : 'otro',
    concepto: concepto.trim() || null,
    fecha: fecha || new Date().toISOString().slice(0, 10),
    registrado_por: centroId,
  });
  if (error) return { ok: false, error: 'No se pudo registrar el cobro.' };
  revalidatePath('/centro/finanzas');
  return { ok: true };
}

/** Elimina un cobro mal capturado. */
export async function eliminarCobroAction(id: string): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId) return { ok: false };
  const { error } = await admin().from('centro_cobros').delete().eq('id', id).eq('centro_id', centroId);
  if (error) return { ok: false };
  revalidatePath('/centro/finanzas');
  return { ok: true };
}
