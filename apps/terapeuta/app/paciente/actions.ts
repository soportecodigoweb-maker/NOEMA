'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

type Privacidad = 'privado' | 'compartido' | 'marcado_sesion';

/** Crea un registro emocional del paciente. */
export async function crearRegistroAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const emocion = String(formData.get('emocion') ?? '');
  // Emociones adicionales (el paciente puede elegir varias).
  const secundarias = String(formData.get('emociones_secundarias') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const otro = String(formData.get('emocion_otro') ?? '').trim();
  const intensidad = Number(formData.get('intensidad') ?? 3);
  let descripcion = String(formData.get('descripcion') ?? '').trim();
  const situacion = String(formData.get('situacion') ?? '').trim();
  const privacidad = String(formData.get('privacidad') ?? 'privado') as Privacidad;

  if (!emocion) return { ok: false, error: 'Elige al menos una emoción.' };

  // La emoción "Otro" se guarda como texto libre dentro de la descripción, para
  // que el terapeuta la vea sin perder el detalle que escribió el paciente.
  if (otro) {
    descripcion = descripcion ? `Otra emoción: ${otro} — ${descripcion}` : `Otra emoción: ${otro}`;
  }

  const { error } = await supabase.from('registros_emocionales').insert({
    paciente_id: user.id,
    emocion_principal_key: emocion,
    emociones_secundarias: secundarias,
    intensidad,
    descripcion: descripcion || null,
    situacion_detonante: situacion || null,
    privacidad,
  });

  if (error) return { ok: false, error: 'No se pudo guardar el registro.' };
  revalidatePath('/paciente/registros');
  revalidatePath('/paciente/progreso');
  return { ok: true };
}

/** Crea una entrada de diario. */
export async function crearDiarioAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'No autenticado.' };

  const titulo = String(formData.get('titulo') ?? '').trim();
  const contenido = String(formData.get('contenido') ?? '').trim();
  const privacidad = String(formData.get('privacidad') ?? 'privado') as Privacidad;

  if (!contenido) return { ok: false, error: 'Escribe algo en tu diario.' };

  const { error } = await supabase.from('diario_entradas').insert({
    paciente_id: user.id,
    titulo: titulo || null,
    contenido,
    privacidad,
  });

  if (error) return { ok: false, error: 'No se pudo guardar.' };
  revalidatePath('/paciente/diario');
  return { ok: true };
}

/** Crea una meta/recordatorio personal. */
export async function crearMetaAction(titulo: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !titulo.trim()) return { ok: false };

  const { error } = await supabase.from('recordatorios_personales').insert({
    paciente_id: user.id,
    titulo: titulo.trim(),
  });
  if (error) return { ok: false };
  revalidatePath('/paciente/metas');
  return { ok: true };
}

export async function toggleMetaAction(id: string, completado: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recordatorios_personales')
    .update({ completado, completado_at: completado ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return { ok: false };
  revalidatePath('/paciente/metas');
  return { ok: true };
}

export async function eliminarMetaAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('recordatorios_personales').delete().eq('id', id);
  if (error) return { ok: false };
  revalidatePath('/paciente/metas');
  return { ok: true };
}

/**
 * Vincula al paciente con un terapeuta usando el código de invitación (#3).
 *
 * Antes usábamos el RPC `redimir_codigo`, pero una versión desactualizada de esa
 * función en producción asignaba el paciente sin activar la vinculación (se
 * quedaba en 'pendiente'), así que "Vincular" no completaba nada. Aquí hacemos
 * la activación con el cliente de servicio, tras validar la sesión del usuario.
 * Es seguro: solo escribimos para el usuario autenticado.
 */
export async function redimirCodigoAction(
  codigo: string,
): Promise<{ ok: boolean; error?: string; terapeutaNombre?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Inicia sesión para vincularte.' };

  const code = (codigo ?? '').trim().toUpperCase();
  if (code.replace(/\s/g, '').length < 6) {
    return { ok: false, error: 'El código no es válido. Revisa que esté completo.' };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return { ok: false, error: 'Configuración incompleta del servidor.' };
  }
  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const nombreTerapeuta = async (id: string | null): Promise<string | undefined> => {
    if (!id) return undefined;
    const { data } = await admin.from('profiles').select('nombre').eq('id', id).maybeSingle();
    return data?.nombre ?? undefined;
  };

  // 1. Buscar la vinculación PENDIENTE con ese código.
  const { data: vinc, error: eFind } = await admin
    .from('vinculaciones')
    .select('id, estado, paciente_id, terapeuta_id')
    .eq('codigo_invitacion', code)
    .eq('estado', 'pendiente')
    .maybeSingle();
  if (eFind) return { ok: false, error: 'No se pudo validar el código. Intenta de nuevo.' };

  if (!vinc) {
    // ¿Ya estaba activa con este mismo paciente? (idempotencia: no re-hacer).
    const { data: yaActiva } = await admin
      .from('vinculaciones')
      .select('id, terapeuta_id')
      .eq('codigo_invitacion', code)
      .eq('paciente_id', user.id)
      .in('estado', ['activa', 'pausada'])
      .maybeSingle();
    if (yaActiva) {
      revalidatePath('/paciente', 'layout');
      return { ok: true, terapeutaNombre: await nombreTerapeuta(yaActiva.terapeuta_id) };
    }
    return { ok: false, error: 'Código no válido o ya usado.' };
  }

  // 2. La invitación no debe estar tomada por OTRO paciente.
  if (vinc.paciente_id && vinc.paciente_id !== user.id) {
    return { ok: false, error: 'Ese código ya fue usado por otra persona.' };
  }

  // 3. El paciente no puede tener ya un terapeuta activo distinto.
  const { data: activaExistente } = await admin
    .from('vinculaciones')
    .select('id')
    .eq('paciente_id', user.id)
    .in('estado', ['activa', 'pausada'])
    .maybeSingle();
  if (activaExistente) {
    return { ok: false, error: 'Ya tienes un terapeuta vinculado.' };
  }

  // 4. Asegurar la fila en pacientes (FK de vinculaciones).
  await admin.from('pacientes').upsert({ profile_id: user.id }, { onConflict: 'profile_id' });

  // 5. Activar la vinculación.
  const ahora = new Date().toISOString();
  const { error: eUpd } = await admin
    .from('vinculaciones')
    .update({
      paciente_id: user.id,
      estado: 'activa',
      fecha_inicio: ahora,
      consentimiento_aceptado_at: ahora,
    })
    .eq('id', vinc.id);
  if (eUpd) return { ok: false, error: 'No se pudo completar la vinculación. Intenta de nuevo.' };

  // 6. Marcar al usuario como paciente.
  await admin
    .from('profiles')
    .update({ rol: 'paciente', onboarding_completo: true })
    .eq('id', user.id);

  revalidatePath('/paciente', 'layout');
  return { ok: true, terapeutaNombre: await nombreTerapeuta(vinc.terapeuta_id) };
}

/** Responde una tarea (con campos dinámicos). */
export async function responderTareaAction(
  tareaId: string,
  respuestas: Record<string, string | number>,
  textoLibre: string,
  dificultad: number,
  compartir: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.from('tarea_respuestas').insert({
    tarea_id: tareaId,
    paciente_id: user.id,
    respuestas,
    texto_libre: textoLibre || null,
    dificultad_percibida: dificultad,
    compartir_terapeuta: compartir,
  });
  if (error) return { ok: false };

  // Al enviar el formulario la tarea queda COMPLETADA (antes se quedaba en
  // 'en_progreso' para siempre y el terapeuta nunca la veía terminada).
  await supabase
    .from('tareas')
    .update({ estado: 'completada' })
    .eq('id', tareaId)
    .in('estado', ['pendiente', 'en_progreso']);

  revalidatePath('/paciente/tareas');
  return { ok: true };
}
