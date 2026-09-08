'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  elegirFraseMotivacional,
  fraseDeFamilia,
  semillaDelDia,
  type FamiliaFrase,
} from '@/lib/frases-motivacionales';

type Privacidad = 'privado' | 'compartido' | 'marcado_sesion';

/**
 * Asegura que exista la fila en `pacientes` (FK de registros/diario/metas).
 *
 * Un usuario nuevo entra como `sin_terapeuta` y la política RLS solo deja crear
 * su fila si su rol ya es 'paciente' — así que antes de vincularse no podía
 * registrar emociones (fallaba el FK). Aquí la creamos con el cliente de
 * servicio para que pueda usar sus funciones desde el primer momento.
 */
async function asegurarFilaPaciente(userId: string): Promise<boolean> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) return false;
  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin
    .from('pacientes')
    .upsert({ profile_id: userId }, { onConflict: 'profile_id' });
  return !error;
}

/** Crea un registro emocional del paciente. */
export async function crearRegistroAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; frase?: string }> {
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
  const privacidad: Privacidad = 'compartido'; // siempre se comparte con el terapeuta

  if (!emocion) return { ok: false, error: 'Elige al menos una emoción.' };

  await asegurarFilaPaciente(user.id);

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
  // Nota: la notificación al terapeuta la crea el trigger `trg_notificar_registro`
  // en la BD (no hace falta crearla aquí; hacerlo duplicaría el aviso).

  // Frase motivacional acorde a lo que acaba de registrar (según su "cuadro").
  const { data: emo } = await supabase
    .from('emociones_catalogo')
    .select('familia')
    .eq('key', emocion)
    .maybeSingle();
  const familia = (emo?.familia as FamiliaFrase) ?? 'general';
  const frase = fraseDeFamilia(FAMILIAS_VALIDAS.has(familia) ? familia : 'general', semillaDelDia() + intensidad);

  return { ok: true, frase };
}

const FAMILIAS_VALIDAS = new Set<FamiliaFrase>(['tranquilo', 'ansioso', 'triste', 'cansado', 'feliz', 'general']);

/**
 * Frase motivacional del día para el paciente, elegida por algoritmo según el
 * cuadro emocional que viene presentando (registros de los últimos 7 días).
 */
export async function obtenerFraseMotivacionalAction(): Promise<{ familia: FamiliaFrase; frase: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { familia: 'general', frase: fraseDeFamilia('general', semillaDelDia()) };

  const desde = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [{ data: registros }, { data: catalogo }] = await Promise.all([
    supabase
      .from('registros_emocionales')
      .select('emocion_principal_key')
      .eq('paciente_id', user.id)
      .gte('fecha', desde),
    supabase.from('emociones_catalogo').select('key, familia'),
  ]);

  const familiaPorKey = new Map((catalogo ?? []).map((e) => [e.key, e.familia as FamiliaFrase]));
  const conteo: Partial<Record<FamiliaFrase, number>> = {};
  for (const r of registros ?? []) {
    const fam = familiaPorKey.get(r.emocion_principal_key) ?? 'general';
    conteo[fam] = (conteo[fam] ?? 0) + 1;
  }

  return elegirFraseMotivacional(conteo, semillaDelDia());
}

/**
 * Cambia la privacidad de uno o varios registros emocionales YA creados, para
 * que el paciente pueda compartir con su terapeuta (o volver a privado) después
 * de haberlos guardado. Funciona individual o en lote.
 */
export async function cambiarPrivacidadRegistrosAction(
  ids: string[],
  privacidad: Privacidad,
): Promise<{ ok: boolean; cambiados?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  const limpios = (ids ?? []).filter(Boolean);
  if (limpios.length === 0) return { ok: false, error: 'No elegiste ningún registro.' };
  if (!['privado', 'compartido', 'marcado_sesion'].includes(privacidad)) {
    return { ok: false, error: 'Opción no válida.' };
  }

  const { error, count } = await supabase
    .from('registros_emocionales')
    .update({ privacidad }, { count: 'exact' })
    .in('id', limpios)
    .eq('paciente_id', user.id); // solo los suyos
  if (error) return { ok: false, error: 'No se pudo actualizar. Intenta de nuevo.' };

  revalidatePath('/paciente/registros');
  revalidatePath('/paciente/progreso');
  return { ok: true, cambiados: count ?? limpios.length };
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

  await asegurarFilaPaciente(user.id);

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

/**
 * Crea una meta/objetivo personal.
 * tipo: 'diario' (objetivo del día, se reinicia) | 'corto' | 'mediano' | 'largo'.
 * recurrencia: para 'diario', 'diario' o letras de días 'L,M,X,J,V,S,D'.
 */
export async function crearMetaAction(
  titulo: string,
  tipo: 'diario' | 'corto' | 'mediano' | 'largo' = 'corto',
  recurrencia: string | null = null,
): Promise<{ ok: boolean; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !titulo.trim()) return { ok: false };

  await asegurarFilaPaciente(user.id);

  const { data, error } = await supabase
    .from('recordatorios_personales')
    .insert({
      paciente_id: user.id,
      titulo: titulo.trim(),
      tipo,
      ...(recurrencia ? { recurrencia } : {}),
    })
    .select('id')
    .single();
  if (error) return { ok: false };
  revalidatePath('/paciente/metas');
  return { ok: true, id: data?.id };
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

/** El paciente decide si comparte una meta con su terapeuta o la deja privada. */
export async function compartirMetaAction(id: string, compartida: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase
    .from('recordatorios_personales')
    .update({ compartida })
    .eq('id', id)
    .eq('paciente_id', user.id);
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

  // Quitamos TODO espacio (incluye invisibles/pegados) y normalizamos a mayúsculas.
  const code = (codigo ?? '').replace(/\s+/g, '').toUpperCase();
  if (code.length < 6) {
    return { ok: false, error: 'El código no es válido. Revisa que esté completo.' };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
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

  // 1. Buscar la vinculación con ese código (sin filtrar por estado, para poder
  //    dar un mensaje claro según su situación real). Case-insensitive.
  const { data: vinc, error: eFind } = await admin
    .from('vinculaciones')
    .select('id, estado, paciente_id, terapeuta_id')
    .ilike('codigo_invitacion', code)
    .maybeSingle();
  if (eFind) return { ok: false, error: 'No se pudo validar el código. Intenta de nuevo.' };

  if (!vinc) {
    return { ok: false, error: 'Código no válido. Revisa que esté bien escrito.' };
  }

  // Ya estaba vinculada con este mismo paciente (idempotencia: éxito).
  if (vinc.paciente_id === user.id && (vinc.estado === 'activa' || vinc.estado === 'pausada')) {
    revalidatePath('/paciente', 'layout');
    return { ok: true, terapeutaNombre: await nombreTerapeuta(vinc.terapeuta_id) };
  }

  // 2. La invitación no debe estar tomada por OTRO paciente.
  if (vinc.paciente_id && vinc.paciente_id !== user.id) {
    return { ok: false, error: 'Ese código ya fue usado por otra persona.' };
  }

  // La invitación debe estar disponible (pendiente).
  if (vinc.estado !== 'pendiente') {
    return { ok: false, error: 'Este código ya no está disponible.' };
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

  // 4. Asegurar la fila en pacientes (FK obligatorio de vinculaciones).
  //    Si esto falla, el paso 5 revienta con error de llave foránea, así que
  //    lo verificamos explícitamente en vez de continuar a ciegas.
  const { error: ePac } = await admin
    .from('pacientes')
    .upsert({ profile_id: user.id }, { onConflict: 'profile_id' });
  if (ePac) {
    return { ok: false, error: 'No pudimos preparar tu perfil de paciente. Intenta de nuevo.' };
  }

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
  if (eUpd) {
    const msg = (eUpd.message ?? '').toLowerCase();
    if (msg.includes('foreign key') || msg.includes('violates')) {
      return { ok: false, error: 'No pudimos completar la vinculación (perfil incompleto). Intenta de nuevo.' };
    }
    return { ok: false, error: 'No se pudo completar la vinculación. Intenta de nuevo.' };
  }

  // 6. Marcar al usuario como paciente.
  await admin
    .from('profiles')
    .update({ rol: 'paciente', onboarding_completo: true })
    .eq('id', user.id);

  // 7. Notificar a AMBAS partes de la vinculación.
  const nombreTera = await nombreTerapeuta(vinc.terapeuta_id);
  const { data: pacRow } = await admin
    .from('profiles')
    .select('nombre, apellidos')
    .eq('id', user.id)
    .maybeSingle();
  const nombrePaciente =
    [pacRow?.nombre, pacRow?.apellidos].filter(Boolean).join(' ') || 'Tu nuevo paciente';

  const notifs: Array<{
    destinatario_id: string;
    tipo: string;
    titulo: string;
    cuerpo: string;
    vinculacion_id: string;
    url: string;
  }> = [
    {
      destinatario_id: user.id,
      tipo: 'vinculacion',
      titulo: '¡Vinculación exitosa!',
      cuerpo: nombreTera
        ? `Ya estás vinculado con ${nombreTera}. Tu proceso continúa acompañado.`
        : 'Tu vinculación se completó con éxito.',
      vinculacion_id: vinc.id,
      url: '/paciente',
    },
  ];
  if (vinc.terapeuta_id) {
    notifs.push({
      destinatario_id: vinc.terapeuta_id,
      tipo: 'vinculacion',
      titulo: 'Nuevo paciente vinculado',
      cuerpo: `${nombrePaciente} se vinculó contigo. Ya puedes darle seguimiento.`,
      vinculacion_id: vinc.id,
      url: `/pacientes/${vinc.id}`,
    });
  }
  await admin.from('notificaciones').insert(notifs);

  revalidatePath('/paciente', 'layout');
  return { ok: true, terapeutaNombre: nombreTera };
}

/** Responde una tarea (con campos dinámicos). */
export async function responderTareaAction(
  tareaId: string,
  respuestas: Record<string, string | number>,
  textoLibre: string,
  dificultad: number,
  compartir: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  // La fila del paciente debe existir (FK) y la dificultad solo admite 1..5:
  // si no la indicó (0 o fuera de rango), se guarda como null.
  await asegurarFilaPaciente(user.id);
  const dif = dificultad >= 1 && dificultad <= 5 ? dificultad : null;

  const { error } = await supabase.from('tarea_respuestas').insert({
    tarea_id: tareaId,
    paciente_id: user.id,
    respuestas,
    texto_libre: textoLibre || null,
    dificultad_percibida: dif,
    compartir_terapeuta: compartir,
  });
  if (error) return { ok: false, error: 'No se pudo enviar tu respuesta. Intenta de nuevo.' };

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

/** El propio paciente se desvincula de su terapeuta (con advertencia en la UI).
 *  Cierra la vinculación y avisa al terapeuta. */
export async function desvincularmeAction(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) return { ok: false, error: 'Configuración no disponible.' };
  const db = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: vinc } = await db
    .from('vinculaciones')
    .select('id, terapeuta_id')
    .eq('paciente_id', user.id)
    .in('estado', ['activa', 'pausada'])
    .order('fecha_inicio', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!vinc) return { ok: false, error: 'No tienes un terapeuta vinculado.' };

  const { error } = await db
    .from('vinculaciones')
    .update({ estado: 'finalizada', fecha_fin: new Date().toISOString() })
    .eq('id', vinc.id);
  if (error) return { ok: false, error: 'No se pudo desvincular. Intenta de nuevo.' };

  await db.from('profiles').update({ rol: 'sin_terapeuta' }).eq('id', user.id);

  if (vinc.terapeuta_id) {
    const { data: perfil } = await db.from('profiles').select('nombre').eq('id', user.id).maybeSingle();
    await db.from('notificaciones').insert({
      destinatario_id: vinc.terapeuta_id,
      tipo: 'vinculacion',
      titulo: 'Un paciente se desvinculó',
      cuerpo: `${perfil?.nombre ?? 'Un paciente'} decidió terminar el vínculo contigo.`,
      url: '/pacientes',
    });
  }

  revalidatePath('/paciente/cuenta');
  revalidatePath('/paciente');
  return { ok: true };
}
