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

/** El centro activa/desactiva la supervisión clínica. Al activar, pide a sus
 *  terapeutas que autoricen el acceso a la información de sus pacientes. */
export async function activarSupervisionAction(activo: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: perfil } = await db.from('profiles').select('rol').eq('id', user.id).maybeSingle();
  if (perfil?.rol !== 'centro') return { ok: false };

  const { error } = await db
    .from('centros')
    .update({ supervision_clinica: activo })
    .eq('profile_id', user.id);
  if (error) return { ok: false };

  if (activo) {
    const { data: nombreCentro } = await db
      .from('centros')
      .select('nombre_centro')
      .eq('profile_id', user.id)
      .maybeSingle();
    const { data: miembros } = await db
      .from('centro_terapeutas')
      .select('terapeuta_id')
      .eq('centro_id', user.id)
      .eq('estado', 'activa')
      .eq('supervision_autorizada', false);
    const notifs = (miembros ?? []).map((m) => ({
      destinatario_id: m.terapeuta_id,
      tipo: 'supervision',
      titulo: 'Tu centro solicita autorización de supervisión',
      cuerpo: `${nombreCentro?.nombre_centro ?? 'Tu centro'} activó supervisión clínica y pide tu autorización para acceder a la información de tus pacientes.`,
      url: '/inicio',
    }));
    if (notifs.length) await db.from('notificaciones').insert(notifs);
  }

  revalidatePath('/centro');
  return { ok: true };
}

/** Registra que el centro accedió a la info de un paciente y avisa al terapeuta
 *  (con fecha y hora). Se llama al abrir la vista de supervisión. */
export async function registrarAccesoSupervisionAction(
  vinculacionId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('terapeuta_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc) return { ok: false };
  // El terapeuta debe pertenecer a este centro.
  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('id')
    .eq('centro_id', user.id)
    .eq('terapeuta_id', vinc.terapeuta_id)
    .maybeSingle();
  if (!ct) return { ok: false };

  await db.from('supervision_accesos').insert({
    centro_id: user.id,
    terapeuta_id: vinc.terapeuta_id,
    vinculacion_id: vinculacionId,
  });

  const cuando = new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });
  const { data: centro } = await db.from('centros').select('nombre_centro').eq('profile_id', user.id).maybeSingle();
  await db.from('notificaciones').insert({
    destinatario_id: vinc.terapeuta_id,
    tipo: 'supervision',
    titulo: 'Supervisión: acceso a un paciente',
    cuerpo: `${centro?.nombre_centro ?? 'Tu centro'} accedió a la información de un paciente para supervisión el ${cuando}.`,
    vinculacion_id: vinculacionId,
    url: `/pacientes/${vinculacionId}`,
  });

  return { ok: true };
}

/** El centro solicita acceso PUNTUAL a un paciente (cuando la supervisión
 *  general no está activa/autorizada). El terapeuta debe autorizar cada vez. */
export async function solicitarAccesoPacienteAction(
  vinculacionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const db = admin();
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('terapeuta_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc) return { ok: false, error: 'Paciente no encontrado.' };
  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('id')
    .eq('centro_id', user.id)
    .eq('terapeuta_id', vinc.terapeuta_id)
    .maybeSingle();
  if (!ct) return { ok: false, error: 'Ese terapeuta no pertenece a tu centro.' };

  // Evitar duplicar solicitudes pendientes.
  const { data: existe } = await db
    .from('supervision_solicitudes')
    .select('id')
    .eq('vinculacion_id', vinculacionId)
    .eq('estado', 'pendiente')
    .maybeSingle();
  if (!existe) {
    await db.from('supervision_solicitudes').insert({
      centro_id: user.id,
      terapeuta_id: vinc.terapeuta_id,
      vinculacion_id: vinculacionId,
      estado: 'pendiente',
    });
    const { data: centro } = await db.from('centros').select('nombre_centro').eq('profile_id', user.id).maybeSingle();
    await db.from('notificaciones').insert({
      destinatario_id: vinc.terapeuta_id,
      tipo: 'supervision',
      titulo: 'Solicitud de acceso para supervisión',
      cuerpo: `${centro?.nombre_centro ?? 'Tu centro'} solicita autorización para revisar la información de un paciente.`,
      vinculacion_id: vinculacionId,
      url: '/inicio',
    });
  }

  revalidatePath(`/centro/supervision/${vinculacionId}`);
  return { ok: true };
}

/** El centro suspende, reactiva o elimina a un terapeuta de su centro. */
export async function gestionarTerapeutaCentroAction(
  terapeutaId: string,
  accion: 'suspender' | 'reactivar' | 'eliminar',
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('id')
    .eq('centro_id', user.id)
    .eq('terapeuta_id', terapeutaId)
    .maybeSingle();
  if (!ct) return { ok: false };

  if (accion === 'eliminar') {
    await db.from('centro_terapeutas').delete().eq('id', ct.id);
  } else {
    await db
      .from('centro_terapeutas')
      .update({ estado: accion === 'suspender' ? 'inactiva' : 'activa' })
      .eq('id', ct.id);
  }

  const cuerpo =
    accion === 'eliminar'
      ? 'Tu vínculo con el centro terapéutico terminó.'
      : accion === 'suspender'
        ? 'Tu vínculo con el centro fue suspendido temporalmente.'
        : 'Tu vínculo con el centro fue reactivado.';
  await db.from('notificaciones').insert({
    destinatario_id: terapeutaId,
    tipo: 'centro',
    titulo: 'Cambio en tu centro terapéutico',
    cuerpo,
    url: '/ajustes',
  });

  revalidatePath('/centro/terapeutas');
  return { ok: true };
}

/** El supervisor (centro) deja una observación sobre la práctica del terapeuta. */
export async function comentarPracticaAction(
  terapeutaId: string,
  texto: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !texto.trim()) return { ok: false };

  const db = admin();
  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('id')
    .eq('centro_id', user.id)
    .eq('terapeuta_id', terapeutaId)
    .maybeSingle();
  if (!ct) return { ok: false };

  const { error } = await db.from('supervision_comentarios').insert({
    centro_id: user.id,
    terapeuta_id: terapeutaId,
    texto: texto.trim(),
  });
  if (error) return { ok: false };

  await db.from('notificaciones').insert({
    destinatario_id: terapeutaId,
    tipo: 'supervision',
    titulo: 'Observación de supervisión clínica',
    cuerpo: 'El supervisor de tu centro dejó una observación sobre tu práctica clínica.',
    url: '/inicio',
  });

  revalidatePath('/centro/terapeutas');
  return { ok: true };
}
