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
      url: '/mi-centro',
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
      url: '/mi-centro',
    });
  }

  revalidatePath(`/centro/supervision/${vinculacionId}`);
  return { ok: true };
}

/** El centro invita a un terapeuta por correo. Queda PENDIENTE hasta que él
 *  acepte: nadie entra a un centro sin su consentimiento. */
export async function invitarTerapeutaAction(
  email: string,
): Promise<{ ok: boolean; error?: string; aviso?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const db = admin();
  const { data: perfilCentro } = await db.from('profiles').select('rol').eq('id', user.id).maybeSingle();
  if (perfilCentro?.rol !== 'centro') return { ok: false, error: 'Sin permiso.' };

  const correo = email.trim().toLowerCase();
  if (!correo) return { ok: false, error: 'Escribe el correo del terapeuta.' };

  const { data: prof } = await db
    .from('profiles')
    .select('id, rol, nombre, apellidos')
    .eq('email', correo)
    .maybeSingle();

  if (!prof) {
    return {
      ok: false,
      error: 'No hay ninguna cuenta con ese correo. Pídele que se registre en NOEMA como terapeuta y vuelve a invitarlo.',
    };
  }
  if (prof.rol !== 'terapeuta') {
    return { ok: false, error: 'Esa cuenta no es de terapeuta.' };
  }

  // ¿Ya pertenece a algún centro?
  const { data: yaEn } = await db
    .from('centro_terapeutas')
    .select('id, centro_id, estado')
    .eq('terapeuta_id', prof.id)
    .maybeSingle();
  if (yaEn && yaEn.centro_id !== user.id) {
    return { ok: false, error: 'Ese terapeuta ya pertenece a otro centro.' };
  }
  if (yaEn && yaEn.centro_id === user.id) {
    if (yaEn.estado === 'activa') return { ok: true, aviso: 'Ese terapeuta ya es miembro de tu centro.' };
    await db
      .from('centro_terapeutas')
      .update({ estado: 'pendiente', invitado_at: new Date().toISOString() })
      .eq('id', yaEn.id);
  } else {
    const nombre = [prof.nombre, prof.apellidos].filter(Boolean).join(' ') || 'Terapeuta';
    const { error } = await db.from('centro_terapeutas').insert({
      centro_id: user.id,
      terapeuta_id: prof.id,
      terapeuta_nombre: nombre,
      estado: 'pendiente',
      email_invitado: correo,
      invitado_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: 'No se pudo enviar la invitación.' };
  }

  const { data: c } = await db.from('centros').select('nombre_centro').eq('profile_id', user.id).maybeSingle();
  await db.from('notificaciones').insert({
    destinatario_id: prof.id,
    tipo: 'centro',
    titulo: 'Invitación a un centro terapéutico',
    cuerpo: `${c?.nombre_centro ?? 'Un centro'} te invitó a formar parte de su equipo. Revisa la invitación para aceptarla.`,
    url: '/mi-centro',
  });

  revalidatePath('/centro/terapeutas');
  return { ok: true, aviso: 'Invitación enviada. El terapeuta debe aceptarla.' };
}

/** El centro edita el acuerdo de colaboración que aceptan sus terapeutas. */
export async function guardarAcuerdoCentroAction(texto: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !texto.trim()) return { ok: false };

  const db = admin();
  const { data: perfil } = await db.from('profiles').select('rol').eq('id', user.id).maybeSingle();
  if (perfil?.rol !== 'centro') return { ok: false };

  const { error } = await db
    .from('centros')
    .update({ acuerdo_terapeuta: texto.trim() })
    .eq('profile_id', user.id);
  if (error) return { ok: false };
  revalidatePath('/centro/terapeutas');
  return { ok: true };
}

/** El centro confirma la incorporación de un terapeuta que ya aceptó el acuerdo. */
export async function confirmarIncorporacionAction(
  terapeutaId: string,
  acepta: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('id, estado')
    .eq('centro_id', user.id)
    .eq('terapeuta_id', terapeutaId)
    .maybeSingle();
  if (!ct || ct.estado !== 'por_confirmar') return { ok: false };

  if (acepta) {
    await db.from('centro_terapeutas').update({ estado: 'activa' }).eq('id', ct.id);
  } else {
    await db.from('centro_terapeutas').delete().eq('id', ct.id);
  }

  const { data: c } = await db.from('centros').select('nombre_centro').eq('profile_id', user.id).maybeSingle();
  await db.from('notificaciones').insert({
    destinatario_id: terapeutaId,
    tipo: 'centro',
    titulo: acepta ? 'Ya formas parte del centro' : 'Incorporación no confirmada',
    cuerpo: acepta
      ? `${c?.nombre_centro ?? 'El centro'} confirmó tu incorporación al equipo.`
      : `${c?.nombre_centro ?? 'El centro'} no confirmó tu incorporación.`,
    url: '/mi-centro',
  });

  revalidatePath('/centro/terapeutas');
  return { ok: true };
}

/** Reasigna TODOS los pacientes activos de un terapeuta a otro del centro. */
export async function reasignarTodosPacientesAction(
  origenId: string,
  destinoId: string,
): Promise<{ ok: boolean; movidos?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (origenId === destinoId) return { ok: false, error: 'Elige un terapeuta distinto.' };

  const db = admin();
  const { data: miembros } = await db
    .from('centro_terapeutas')
    .select('terapeuta_id, terapeuta_nombre, estado')
    .eq('centro_id', user.id)
    .in('terapeuta_id', [origenId, destinoId]);
  const origen = (miembros ?? []).find((m) => m.terapeuta_id === origenId);
  const destino = (miembros ?? []).find((m) => m.terapeuta_id === destinoId);
  if (!origen || !destino) return { ok: false, error: 'Ambos terapeutas deben ser de tu centro.' };
  if (destino.estado !== 'activa') return { ok: false, error: 'El terapeuta destino no está activo.' };

  const { data: vincs } = await db
    .from('vinculaciones')
    .select('id, paciente_id')
    .eq('terapeuta_id', origenId)
    .in('estado', ['activa', 'pausada']);
  const lista = vincs ?? [];
  if (lista.length === 0) return { ok: true, movidos: 0 };

  const { error } = await db
    .from('vinculaciones')
    .update({ terapeuta_id: destinoId })
    .in(
      'id',
      lista.map((v) => v.id),
    );
  if (error) return { ok: false, error: 'No se pudo reasignar. Intenta de nuevo.' };

  const notifs: any[] = [
    {
      destinatario_id: destinoId,
      tipo: 'centro',
      titulo: 'Se te reasignaron pacientes',
      cuerpo: `Tu centro te asignó ${lista.length} paciente(s) para dar continuidad a su proceso.`,
      url: '/pacientes',
    },
  ];
  for (const v of lista) {
    if (v.paciente_id) {
      notifs.push({
        destinatario_id: v.paciente_id,
        tipo: 'centro',
        titulo: 'Tu terapeuta cambió',
        cuerpo: `Tu centro asignó a ${destino.terapeuta_nombre ?? 'un nuevo terapeuta'} para continuar tu proceso.`,
        url: '/paciente',
      });
    }
  }
  await db.from('notificaciones').insert(notifs);

  revalidatePath('/centro/terapeutas');
  return { ok: true, movidos: lista.length };
}

/** El centro suspende, reactiva o elimina a un terapeuta de su centro. */
export async function gestionarTerapeutaCentroAction(
  terapeutaId: string,
  accion: 'suspender' | 'reactivar' | 'eliminar',
): Promise<{ ok: boolean; error?: string }> {
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
    // No dejamos pacientes huérfanos: primero hay que reasignarlos.
    const { count } = await db
      .from('vinculaciones')
      .select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', terapeutaId)
      .in('estado', ['activa', 'pausada']);
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: `Este terapeuta tiene ${count} paciente(s). Reasígnalos a otro terapeuta antes de eliminarlo.`,
      };
    }
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
    url: '/mi-centro',
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
    url: '/mi-centro',
  });

  revalidatePath('/centro/terapeutas');
  return { ok: true };
}
