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

/** El terapeuta configura el contacto de emergencia y el plan de seguridad. */
export async function guardarPlanTerapeutaAction(
  vinculacionId: string,
  contactoNombre: string,
  contactoRelacion: string,
  contactoTelefono: string,
  planSeguridad: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('plan_apoyo').upsert(
    {
      vinculacion_id: vinculacionId,
      contacto_nombre: contactoNombre.trim() || null,
      contacto_relacion: contactoRelacion.trim() || null,
      contacto_telefono: contactoTelefono.trim() || null,
      plan_seguridad: planSeguridad,
      actualizado_at: new Date().toISOString(),
    },
    { onConflict: 'vinculacion_id' },
  );
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/plan-apoyo`);
  return { ok: true };
}

export interface VisibilidadPlanApoyo {
  ver_lineas_emergencia: boolean;
  ver_contacto_terapeuta: boolean;
  ver_contacto_confianza: boolean;
  ver_recursos: boolean;
}

/** El terapeuta decide qué secciones del Plan de apoyo ve el paciente. */
export async function guardarVisibilidadPlanApoyoAction(
  vinculacionId: string,
  vis: VisibilidadPlanApoyo,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('plan_apoyo').upsert(
    {
      vinculacion_id: vinculacionId,
      ver_lineas_emergencia: vis.ver_lineas_emergencia,
      ver_contacto_terapeuta: vis.ver_contacto_terapeuta,
      ver_contacto_confianza: vis.ver_contacto_confianza,
      ver_recursos: vis.ver_recursos,
      actualizado_at: new Date().toISOString(),
    },
    { onConflict: 'vinculacion_id' },
  );
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/plan-apoyo`);
  return { ok: true };
}

/** Agrega un recurso al plan de apoyo. */
export async function agregarRecursoAction(
  vinculacionId: string,
  tipo: string,
  titulo: string,
  url: string,
  nota: string,
): Promise<{ ok: boolean; id?: string }> {
  const supabase = await createClient();
  if (!titulo.trim()) return { ok: false };
  const { data, error } = await supabase
    .from('plan_apoyo_recursos')
    .insert({
      vinculacion_id: vinculacionId,
      tipo: tipo || 'otro',
      titulo: titulo.trim(),
      url: url.trim() || null,
      nota: nota.trim() || null,
    })
    .select('id')
    .single();
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/plan-apoyo`);
  return { ok: true, id: data?.id };
}

/** Elimina un recurso. */
export async function eliminarRecursoAction(
  id: string,
  vinculacionId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('plan_apoyo_recursos').delete().eq('id', id);
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/plan-apoyo`);
  return { ok: true };
}

/** Retroalimentación del terapeuta sobre un uso del plan → notifica al paciente. */
export async function retroalimentarUsoAction(
  usoId: string,
  vinculacionId: string,
  texto: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('plan_apoyo_usos')
    .update({ retroalimentacion: texto.trim() || null, retro_at: new Date().toISOString() })
    .eq('id', usoId);
  if (error) return { ok: false };

  if (texto.trim()) {
    const { data: uso } = await supabase
      .from('plan_apoyo_usos')
      .select('paciente_id')
      .eq('id', usoId)
      .maybeSingle();
    if (uso?.paciente_id) {
      await admin().from('notificaciones').insert({
        destinatario_id: uso.paciente_id,
        tipo: 'plan_apoyo',
        titulo: 'Tu terapeuta respondió sobre tu Plan de apoyo',
        cuerpo: 'Dejó un mensaje sobre el uso de tu plan de apoyo.',
        vinculacion_id: vinculacionId,
        url: '/paciente/crisis',
      });
    }
  }
  revalidatePath(`/pacientes/${vinculacionId}/plan-apoyo`);
  return { ok: true };
}
