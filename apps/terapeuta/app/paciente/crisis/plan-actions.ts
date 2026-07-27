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

/** Vínculo activo del paciente en sesión. */
async function contexto() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, vinc: null as { id: string; terapeuta_id: string } | null };
  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, terapeuta_id')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();
  return { supabase, user, vinc };
}

async function nombrePaciente(id: string): Promise<string> {
  const { data } = await admin().from('profiles').select('nombre, apellidos').eq('id', id).maybeSingle();
  return [data?.nombre, data?.apellidos].filter(Boolean).join(' ') || 'Tu paciente';
}

async function notificarTerapeuta(
  terapeutaId: string,
  vincId: string,
  titulo: string,
  cuerpo: string,
) {
  await admin().from('notificaciones').insert({
    destinatario_id: terapeutaId,
    tipo: 'plan_apoyo',
    titulo,
    cuerpo,
    vinculacion_id: vincId,
    url: `/pacientes/${vincId}/plan-apoyo`,
  });
}

/** El paciente guarda/edita su contacto de emergencia de confianza. */
export async function guardarContactoEmergenciaAction(
  nombre: string,
  relacion: string,
  telefono: string,
): Promise<{ ok: boolean }> {
  const { supabase, user, vinc } = await contexto();
  if (!user || !vinc) return { ok: false };
  const { error } = await supabase.from('plan_apoyo').upsert(
    {
      vinculacion_id: vinc.id,
      contacto_nombre: nombre.trim() || null,
      contacto_relacion: relacion.trim() || null,
      contacto_telefono: telefono.trim() || null,
      actualizado_at: new Date().toISOString(),
    },
    { onConflict: 'vinculacion_id' },
  );
  if (error) return { ok: false };
  revalidatePath('/paciente/crisis');
  return { ok: true };
}

/** El paciente edita su plan de seguridad → se notifica al terapeuta. */
export async function guardarPlanSeguridadPacienteAction(
  contenido: string,
): Promise<{ ok: boolean }> {
  const { supabase, user, vinc } = await contexto();
  if (!user || !vinc) return { ok: false };
  const ahora = new Date().toISOString();
  const { error } = await supabase.from('plan_apoyo').upsert(
    {
      vinculacion_id: vinc.id,
      plan_seguridad: contenido,
      plan_editado_por_paciente_at: ahora,
      actualizado_at: ahora,
    },
    { onConflict: 'vinculacion_id' },
  );
  if (error) return { ok: false };
  if (vinc.terapeuta_id) {
    await notificarTerapeuta(
      vinc.terapeuta_id,
      vinc.id,
      'Tu paciente editó su plan de seguridad',
      `${await nombrePaciente(user.id)} modificó su plan de seguridad.`,
    );
  }
  revalidatePath('/paciente/crisis');
  return { ok: true };
}

/** Preferencia: notificar al terapeuta cuando use el plan. */
export async function guardarNotificarUsoAction(activo: boolean): Promise<{ ok: boolean }> {
  const { supabase, user, vinc } = await contexto();
  if (!user || !vinc) return { ok: false };
  const { error } = await supabase.from('plan_apoyo').upsert(
    { vinculacion_id: vinc.id, notificar_uso: activo, actualizado_at: new Date().toISOString() },
    { onConflict: 'vinculacion_id' },
  );
  return { ok: !error };
}

/** El paciente registra que utilizó su Plan de apoyo (evento + aviso opcional). */
export async function registrarUsoPlanApoyoAction(): Promise<{ ok: boolean; notificado: boolean }> {
  const { supabase, user, vinc } = await contexto();
  if (!user || !vinc) return { ok: false, notificado: false };
  const { data: plan } = await supabase
    .from('plan_apoyo')
    .select('notificar_uso')
    .eq('vinculacion_id', vinc.id)
    .maybeSingle();
  const notificar = plan?.notificar_uso !== false;

  // Registrar el evento en el expediente (fecha/hora la pone la BD).
  const { error } = await supabase
    .from('plan_apoyo_usos')
    .insert({ vinculacion_id: vinc.id, paciente_id: user.id });
  if (error) return { ok: false, notificado: false };

  if (notificar && vinc.terapeuta_id) {
    await notificarTerapeuta(
      vinc.terapeuta_id,
      vinc.id,
      'Tu paciente usó su Plan de apoyo',
      `${await nombrePaciente(user.id)} indicó que utilizó su Plan de apoyo.`,
    );
  }
  revalidatePath('/paciente/crisis');
  return { ok: true, notificado: notificar };
}
