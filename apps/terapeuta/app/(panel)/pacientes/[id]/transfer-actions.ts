'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import { crearNoemaAi } from '@noema/ai';
import type { Json, Database } from '@noema/database';
import { createClient } from '@/lib/supabase/server';

/**
 * Transfiere un paciente (con todo su historial) a otro terapeuta registrado,
 * identificándolo por su cédula profesional. La lógica y las validaciones viven
 * en la función `transferir_paciente` de la BD (security definer).
 */
export async function transferirPacienteAction(
  vinculacionId: string,
  cedulaDestino: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  const cedula = cedulaDestino.trim();
  if (!cedula) return { ok: false, error: 'Escribe la cédula del terapeuta destino.' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('transferir_paciente', {
    p_vinculacion_id: vinculacionId,
    p_cedula_destino: cedula,
    p_motivo: motivo.trim() || undefined,
  });

  if (error) return { ok: false, error: 'No se pudo transferir. Revisa la cédula.' };

  const res = data as unknown as { ok: boolean; error?: string };
  if (!res?.ok) return { ok: false, error: res?.error ?? 'No se pudo transferir.' };

  revalidatePath('/pacientes');
  return { ok: true };
}

// ===========================================================================
// Canalización: enlazar al paciente con otro terapeuta de NOEMA, eligiendo qué
// información se incluye en un informe (con IA si está disponible) que le llega
// al terapeuta que recibe. Al canalizar, el paciente pasa a ese terapeuta.
// ===========================================================================

export interface IncluirCanalizacion {
  registros: boolean;
  diario: boolean;
  tareas: boolean;
  notas: boolean;
  metricas: boolean;
}

export async function canalizarPacienteAction(
  vinculacionId: string,
  cedulaDestino: string,
  motivo: string,
  incluir: IncluirCanalizacion,
): Promise<{ ok: boolean; error?: string; reporte?: string; terapeutaDestino?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sesión expirada.' };

  const cedula = cedulaDestino.trim();
  if (!cedula) return { ok: false, error: 'Escribe la cédula del terapeuta destino.' };
  if (!incluir.registros && !incluir.diario && !incluir.tareas && !incluir.notas && !incluir.metricas) {
    return { ok: false, error: 'Elige al menos un tipo de información para el informe.' };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) return { ok: false, error: 'Configuración incompleta del servidor.' };
  const admin = createAdminClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. El terapeuta actual debe ser dueño de la vinculación.
  const { data: vinc } = await admin
    .from('vinculaciones')
    .select('id, terapeuta_id, paciente_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc || vinc.terapeuta_id !== user.id) {
    return { ok: false, error: 'No tienes acceso a este paciente.' };
  }
  if (!vinc.paciente_id) return { ok: false, error: 'La vinculación no tiene paciente.' };

  // 2. Terapeuta destino por cédula.
  const { data: destino } = await admin
    .from('terapeutas')
    .select('profile_id')
    .eq('cedula_profesional', cedula)
    .maybeSingle();
  if (!destino) {
    return { ok: false, error: 'No encontramos un terapeuta con esa cédula en NOEMA.' };
  }
  if (destino.profile_id === user.id) {
    return { ok: false, error: 'Esa es tu propia cédula.' };
  }
  const { data: destinoPerfil } = await admin
    .from('profiles')
    .select('nombre')
    .eq('id', destino.profile_id)
    .maybeSingle();

  // 3. Reunir la info elegida y armar el informe.
  const reporte = await construirInformeCanalizacion(
    admin,
    vinc.paciente_id,
    vinculacionId,
    incluir,
    motivo.trim(),
  );

  // 4. Canalizar: el paciente pasa al terapeuta destino.
  const { error: eUpd } = await admin
    .from('vinculaciones')
    .update({ terapeuta_id: destino.profile_id })
    .eq('id', vinculacionId);
  if (eUpd) return { ok: false, error: 'No se pudo canalizar. Intenta de nuevo.' };

  // 5. Dejar el informe en el historial para el terapeuta que recibe.
  await admin.from('resumenes_sesion').insert({
    vinculacion_id: vinculacionId,
    terapeuta_id: destino.profile_id,
    narrativa: reporte.texto,
    datos: reporte.datos as unknown as Json,
    dias: 90,
  });

  revalidatePath('/pacientes');
  return { ok: true, reporte: reporte.texto, terapeutaDestino: destinoPerfil?.nombre ?? undefined };
}

/** Junta la información seleccionada y redacta el informe (IA si hay clave). */
async function construirInformeCanalizacion(
  admin: SupabaseClient<Database>,
  pacienteId: string,
  vinculacionId: string,
  incluir: IncluirCanalizacion,
  motivo: string,
): Promise<{ texto: string; datos: Record<string, unknown> }> {
  const desde = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const secciones: string[] = [];
  const datos: Record<string, unknown> = { incluir, motivo, desde };

  const { data: pac } = await admin.from('profiles').select('nombre').eq('id', pacienteId).maybeSingle();
  const nombre = pac?.nombre ?? 'El paciente';
  if (motivo) secciones.push(`Motivo de la canalización: ${motivo}.`);

  const { data: catalogo } = await admin.from('emociones_catalogo').select('key, nombre_es');
  const nombreEmocion = new Map((catalogo ?? []).map((e) => [e.key, e.nombre_es]));

  if (incluir.registros || incluir.metricas) {
    const { data: regs } = await admin
      .from('registros_emocionales')
      .select('fecha, emocion_principal_key, intensidad, situacion_detonante, privacidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
      .order('fecha', { ascending: false })
      .limit(90);
    const r = regs ?? [];
    if (incluir.metricas) {
      const prom = r.length ? Math.round((r.reduce((s, x) => s + x.intensidad, 0) / r.length) * 10) / 10 : null;
      const conteo = new Map<string, number>();
      for (const x of r) conteo.set(x.emocion_principal_key, (conteo.get(x.emocion_principal_key) ?? 0) + 1);
      const top = [...conteo.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, n]) => `${nombreEmocion.get(k) ?? k} (${n})`)
        .join(', ');
      secciones.push(
        `Registros emocionales compartidos (últimos 90 días): ${r.length}. Intensidad promedio: ${prom ?? '—'}/5. Emociones más frecuentes: ${top || 'sin datos'}.`,
      );
    }
    if (incluir.registros) {
      const marcados = r
        .filter((x) => x.privacidad === 'marcado_sesion')
        .slice(0, 8)
        .map((x) => `${nombreEmocion.get(x.emocion_principal_key) ?? x.emocion_principal_key} (int. ${x.intensidad}/5)${x.situacion_detonante ? `, detonante: ${x.situacion_detonante}` : ''}`);
      if (marcados.length) secciones.push(`Marcado por el paciente para sesión:\n- ${marcados.join('\n- ')}`);
    }
  }

  if (incluir.diario) {
    const { data: diario } = await admin
      .from('diario_entradas')
      .select('fecha, titulo, contenido, privacidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
      .order('fecha', { ascending: false })
      .limit(5);
    const d = diario ?? [];
    if (d.length) {
      secciones.push(
        `Entradas de diario compartidas: ${d.length}. Extractos:\n- ${d
          .map((x) => `${x.titulo ? `${x.titulo}: ` : ''}${(x.contenido ?? '').slice(0, 200)}`)
          .join('\n- ')}`,
      );
    }
  }

  if (incluir.tareas) {
    const { data: tareas } = await admin
      .from('tareas')
      .select('titulo, estado')
      .eq('vinculacion_id', vinculacionId)
      .limit(20);
    const t = tareas ?? [];
    if (t.length) {
      const comp = t.filter((x) => x.estado === 'completada').length;
      secciones.push(`Tareas asignadas: ${t.length} (completadas: ${comp}). Ejemplos: ${t.slice(0, 5).map((x) => x.titulo).join('; ')}.`);
    }
  }

  if (incluir.notas) {
    const { data: sesiones } = await admin
      .from('sesiones')
      .select('nota:sesion_notas(plan_proxima_sesion)')
      .eq('vinculacion_id', vinculacionId)
      .eq('estado', 'realizada')
      .order('fecha_programada', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nota = sesiones?.nota as { plan_proxima_sesion?: string }[] | { plan_proxima_sesion?: string } | null;
    const plan = (Array.isArray(nota) ? nota[0]?.plan_proxima_sesion : nota?.plan_proxima_sesion) ?? null;
    if (plan) secciones.push(`Plan de la última nota clínica: ${plan}`);
  }

  const cuerpo = secciones.join('\n\n');
  datos.resumen = cuerpo;

  // Encabezado base (siempre presente, aunque no haya IA).
  let texto = `Informe de canalización — ${nombre}\n\n${cuerpo || 'Sin información seleccionada disponible en el periodo.'}\n\nEste informe se generó con la información que el terapeuta de origen decidió compartir. No constituye diagnóstico.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && cuerpo) {
    const ai = crearNoemaAi({ apiKey });
    const r = await ai.generar({
      audiencia: 'clinico',
      instruccion:
        'Redacta un informe de canalización claro y profesional para el terapeuta que va a recibir a este paciente. Resume el panorama y los puntos de atención como observaciones y preguntas abiertas a partir de los datos, sin diagnosticar ni interpretar causas. Cierra sugiriendo focos para la primera sesión.',
      datos: `Paciente: ${nombre}.\n${cuerpo}`,
      maxTokens: 500,
      temperatura: 0.5,
    });
    if (r.ok && r.texto) texto = r.texto;
  }

  return { texto, datos };
}
