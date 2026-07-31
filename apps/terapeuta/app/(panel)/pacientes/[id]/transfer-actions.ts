'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import { crearNoemaAi } from '@noema/ai';
import type { Json, Database } from '@noema/database';
import { createClient } from '@/lib/supabase/server';
import { calcularEdad, type SeccionesInforme } from './transfer-informe';

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
// Canalización: enlazar al paciente con otro terapeuta de NOEMA, adjuntando un
// INFORME PSICOLÓGICO de canalización. El flujo es en dos pasos:
//   1) generarInformeCanalizacionAction → arma un borrador (con IA), SIN mover
//      al paciente. El terapeuta lo revisa y lo edita.
//   2) confirmarCanalizacionAction → con el texto ya aprobado, canaliza al
//      paciente y deja el informe en el historial del terapeuta que recibe.
// ===========================================================================

export interface IncluirCanalizacion {
  registros: boolean;
  diario: boolean;
  tareas: boolean;
  notas: boolean;
  metricas: boolean;
}

function admin(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface Destino {
  vinc: { id: string; terapeuta_id: string; paciente_id: string };
  destinoProfileId: string;
  destinoNombre: string | null;
}

/** Valida que el terapeuta en sesión es dueño y resuelve el terapeuta destino. */
async function resolverDestino(
  db: SupabaseClient<Database>,
  userId: string,
  vinculacionId: string,
  cedula: string,
): Promise<{ ok: true; d: Destino } | { ok: false; error: string }> {
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('id, terapeuta_id, paciente_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc || vinc.terapeuta_id !== userId) {
    return { ok: false, error: 'No tienes acceso a este paciente.' };
  }
  if (!vinc.paciente_id) return { ok: false, error: 'La vinculación no tiene paciente.' };

  const { data: destino } = await db
    .from('terapeutas')
    .select('profile_id')
    .eq('cedula_profesional', cedula)
    .maybeSingle();
  if (!destino) return { ok: false, error: 'No encontramos un terapeuta con esa cédula en NOEMA.' };
  if (destino.profile_id === userId) return { ok: false, error: 'Esa es tu propia cédula.' };

  const { data: perfil } = await db
    .from('profiles')
    .select('nombre')
    .eq('id', destino.profile_id)
    .maybeSingle();

  return {
    ok: true,
    d: {
      vinc: { id: vinc.id, terapeuta_id: vinc.terapeuta_id, paciente_id: vinc.paciente_id },
      destinoProfileId: destino.profile_id,
      destinoNombre: perfil?.nombre ?? null,
    },
  };
}

/** PASO 1 — Genera el borrador del informe psicológico. No mueve al paciente. */
export async function generarInformeCanalizacionAction(
  vinculacionId: string,
  cedulaDestino: string,
  motivo: string,
  incluir: IncluirCanalizacion,
): Promise<{ ok: boolean; error?: string; borrador?: string; terapeutaDestino?: string }> {
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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'Configuración incompleta del servidor.' };
  }

  const db = admin();
  const r = await resolverDestino(db, user.id, vinculacionId, cedula);
  if (!r.ok) return { ok: false, error: r.error };

  const informe = await construirInformeCanalizacion(
    db,
    r.d.vinc.paciente_id,
    vinculacionId,
    incluir,
    motivo.trim(),
  );

  return { ok: true, borrador: informe.texto, terapeutaDestino: r.d.destinoNombre ?? undefined };
}

/** PASO 2 — Con el informe ya revisado y aprobado, canaliza al paciente. */
export async function confirmarCanalizacionAction(
  vinculacionId: string,
  cedulaDestino: string,
  motivo: string,
  texto: string,
  incluir: IncluirCanalizacion,
): Promise<{ ok: boolean; error?: string; terapeutaDestino?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sesión expirada.' };

  const cedula = cedulaDestino.trim();
  if (!cedula) return { ok: false, error: 'Escribe la cédula del terapeuta destino.' };
  if (!texto.trim()) return { ok: false, error: 'El informe no puede quedar vacío.' };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'Configuración incompleta del servidor.' };
  }

  const db = admin();
  const r = await resolverDestino(db, user.id, vinculacionId, cedula);
  if (!r.ok) return { ok: false, error: r.error };

  // Cancelar cualquier canalización pendiente previa de esta vinculación.
  await db
    .from('canalizaciones')
    .update({ estado: 'rechazada', resuelta_at: new Date().toISOString() })
    .eq('vinculacion_id', vinculacionId)
    .eq('estado', 'pendiente');

  // Crear canalización PENDIENTE: el paciente debe autorizar antes de transferir.
  const { error: eIns } = await db.from('canalizaciones').insert({
    vinculacion_id: vinculacionId,
    terapeuta_origen: user.id,
    terapeuta_destino: r.d.destinoProfileId,
    cedula_destino: cedula,
    destino_nombre: r.d.destinoNombre,
    informe: texto.trim(),
    estado: 'pendiente',
  });
  if (eIns) return { ok: false, error: 'No se pudo crear la canalización. Intenta de nuevo.' };

  // Avisar al paciente que debe autorizar.
  await db.from('notificaciones').insert({
    destinatario_id: r.d.vinc.paciente_id,
    tipo: 'canalizacion',
    titulo: 'Tu terapeuta quiere canalizarte',
    cuerpo: 'Necesita tu autorización para enviar tu información a otro terapeuta.',
    vinculacion_id: vinculacionId,
    url: '/paciente',
  });

  // Silenciar el aviso de "no usado" de las variables de firma/metadata.
  void motivo;
  void incluir;

  revalidatePath('/pacientes');
  return { ok: true, terapeutaDestino: r.d.destinoNombre ?? undefined };
}

function unwrapNota<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}

// ===========================================================================
// Informe de canalización v2 — 10 secciones estructuradas y editables.
// ===========================================================================

/** Genera las 10 secciones del informe de canalización (auto + IA). */
export async function generarInformeCanalizacionV2Action(
  vinculacionId: string,
  cedulaDestino: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string; secciones?: SeccionesInforme; terapeutaDestino?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sesión expirada.' };
  const cedula = cedulaDestino.trim();
  if (!cedula) return { ok: false, error: 'Escribe la cédula del terapeuta destino.' };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'Configuración incompleta del servidor.' };
  }

  const db = admin();
  const r = await resolverDestino(db, user.id, vinculacionId, cedula);
  if (!r.ok) return { ok: false, error: r.error };
  const pacienteId = r.d.vinc.paciente_id;

  const hoy = new Date();
  const fechaHoy = hoy.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  // Datos del paciente y del terapeuta remitente.
  const [{ data: pacProfile }, { data: pacRow }, { data: teraProfile }, { data: teraRow }] =
    await Promise.all([
      db.from('profiles').select('nombre').eq('id', pacienteId).maybeSingle(),
      db.from('pacientes').select('fecha_nacimiento, genero, motivos_consulta').eq('profile_id', pacienteId).maybeSingle(),
      db.from('profiles').select('nombre').eq('id', user.id).maybeSingle(),
      db.from('terapeutas').select('cedula_profesional').eq('profile_id', user.id).maybeSingle(),
    ]);

  // 4. Objetivos trabajados (de notas de sesión).
  const { data: sesiones } = await db
    .from('sesiones')
    .select('nota:sesion_notas(objetivos_trabajados)')
    .eq('vinculacion_id', vinculacionId)
    .eq('estado', 'realizada')
    .order('fecha_programada', { ascending: false })
    .limit(12);
  const objetivosSet = new Set<string>();
  for (const s of sesiones ?? []) {
    const nota = unwrapNota(s.nota) as { objetivos_trabajados?: string[] } | null;
    for (const o of nota?.objetivos_trabajados ?? []) objetivosSet.add(o);
  }
  const objetivos = [...objetivosSet];

  // 6. Información registrada en NOEMA.
  const desde = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const { data: catalogo } = await db.from('emociones_catalogo').select('key, nombre_es');
  const nombreEmocion = new Map((catalogo ?? []).map((e) => [e.key, e.nombre_es]));
  const { data: regs } = await db
    .from('registros_emocionales')
    .select('emocion_principal_key, intensidad, situacion_detonante, privacidad')
    .eq('paciente_id', pacienteId)
    .in('privacidad', ['compartido', 'marcado_sesion'])
    .gte('fecha', desde)
    .limit(200);
  const rg = regs ?? [];
  const prom = rg.length ? Math.round((rg.reduce((s, x) => s + x.intensidad, 0) / rg.length) * 10) / 10 : null;
  const conteo = new Map<string, number>();
  for (const x of rg) conteo.set(x.emocion_principal_key, (conteo.get(x.emocion_principal_key) ?? 0) + 1);
  const topEmociones = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, n]) => `${nombreEmocion.get(k) ?? k} (${n})`)
    .join(', ');
  const { data: tareas } = await db.from('tareas').select('estado').eq('vinculacion_id', vinculacionId).limit(200);
  const tareasComp = (tareas ?? []).filter((t) => t.estado === 'completada').length;
  const { data: usos } = await db.from('plan_apoyo_usos').select('id').eq('vinculacion_id', vinculacionId);
  const infoNoemaPartes: string[] = [
    `Frecuencia de registros compartidos (últimos 90 días): ${rg.length}.`,
    prom != null ? `Intensidad emocional promedio: ${prom}/5.` : '',
    topEmociones ? `Emociones predominantes: ${topEmociones}.` : '',
    `Adherencia a tareas: ${tareasComp} de ${(tareas ?? []).length} completadas.`,
    (usos ?? []).length ? `Uso del plan de apoyo: ${(usos ?? []).length} vez(ces).` : '',
  ].filter(Boolean);
  const infoNoema = infoNoemaPartes.join(' ');

  // 5. Resumen del proceso (IA breve).
  let resumenProceso = '';
  const apiKey = process.env.OPENAI_API_KEY;
  const baseDatos = [
    objetivos.length ? `Objetivos trabajados: ${objetivos.join(', ')}.` : '',
    infoNoema,
    (pacRow?.motivos_consulta ?? []).length ? `Motivo de consulta: ${(pacRow?.motivos_consulta ?? []).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  if (apiKey && baseDatos) {
    const ai = crearNoemaAi({ apiKey });
    const g = await ai.generar({
      audiencia: 'clinico',
      instruccion:
        'Redacta un resumen MUY BREVE (3-4 líneas) del proceso terapéutico para un informe de canalización dirigido a otro terapeuta. ' +
        'Describe de forma objetiva qué se ha trabajado y la evolución observada, sin diagnosticar ni interpretar causas. Solo observaciones.',
      datos: baseDatos,
      maxTokens: 240,
      temperatura: 0.5,
    });
    if (g.ok && g.texto) resumenProceso = g.texto.trim();
  }

  const secciones: SeccionesInforme = {
    nombre: pacProfile?.nombre ?? '',
    edad: calcularEdad(pacRow?.fecha_nacimiento ?? null),
    sexo: pacRow?.genero ?? '',
    fecha_nacimiento: pacRow?.fecha_nacimiento ?? '',
    fecha_elaboracion: fechaHoy,
    terapeuta_remitente: teraProfile?.nombre ?? '',
    motivo_canalizacion: motivo.trim(),
    motivo_consulta_inicial: (pacRow?.motivos_consulta ?? []).join(', '),
    objetivos_trabajados: objetivos.join(', '),
    resumen_proceso: resumenProceso,
    info_noema: infoNoema,
    intervenciones: '',
    observaciones: '',
    anexos: {
      notas_clinicas: true,
      registros: true,
      graficas: false,
      plan_apoyo: false,
      objetivos: true,
      consentimientos: false,
    },
    firma_nombre: teraProfile?.nombre ?? '',
    firma_cedula: teraRow?.cedula_profesional ?? '',
    firma_fecha: fechaHoy,
  };

  return { ok: true, secciones, terapeutaDestino: r.d.destinoNombre ?? undefined };
}

/** Junta la información seleccionada y redacta el informe (IA si hay clave). */
async function construirInformeCanalizacion(
  db: SupabaseClient<Database>,
  pacienteId: string,
  vinculacionId: string,
  incluir: IncluirCanalizacion,
  motivo: string,
): Promise<{ texto: string; datos: Record<string, unknown> }> {
  const desde = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const secciones: string[] = [];
  const datos: Record<string, unknown> = { incluir, motivo, desde };

  const { data: pac } = await db.from('profiles').select('nombre').eq('id', pacienteId).maybeSingle();
  const nombre = pac?.nombre ?? 'El paciente';
  if (motivo) secciones.push(`Motivo de la canalización: ${motivo}.`);

  const { data: catalogo } = await db.from('emociones_catalogo').select('key, nombre_es');
  const nombreEmocion = new Map((catalogo ?? []).map((e) => [e.key, e.nombre_es]));

  if (incluir.registros || incluir.metricas) {
    const { data: regs } = await db
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
    const { data: diario } = await db
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
    const { data: tareas } = await db
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
    const { data: sesiones } = await db
      .from('sesiones')
      .select(
        'fecha_programada, nota:sesion_notas(objetivos_trabajados, contenido_publico, contenido_privado, plan_proxima_sesion)',
      )
      .eq('vinculacion_id', vinculacionId)
      .eq('estado', 'realizada')
      .order('fecha_programada', { ascending: false })
      .limit(6);
    const notas = (sesiones ?? [])
      .map((s) => ({ fecha: s.fecha_programada as string | null, n: unwrapNota(s.nota) }))
      .filter((x): x is { fecha: string | null; n: NonNullable<typeof x.n> } => !!x.n);

    const objetivos = [...new Set(notas.flatMap((x) => x.n.objetivos_trabajados ?? []))];
    if (objetivos.length) secciones.push(`Objetivos trabajados en el proceso: ${objetivos.join(', ')}.`);

    const extractos = notas
      .slice(0, 5)
      .map((x) => {
        const partes = [x.n.contenido_publico, x.n.contenido_privado].filter(Boolean).join(' — ');
        if (!partes) return null;
        const f = x.fecha ? new Date(x.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '';
        return `${f ? `(${f}) ` : ''}${partes.slice(0, 320)}`;
      })
      .filter(Boolean) as string[];
    if (extractos.length) secciones.push(`Observaciones de sesión (notas clínicas):\n- ${extractos.join('\n- ')}`);

    const ultimoPlan = notas.find((x) => x.n.plan_proxima_sesion)?.n.plan_proxima_sesion;
    if (ultimoPlan) secciones.push(`Plan de la última nota clínica: ${ultimoPlan}`);
  }

  const cuerpo = secciones.join('\n\n');
  datos.resumen = cuerpo;

  // Informe base en texto plano (siempre presente, aunque no haya IA).
  let texto =
    `INFORME PSICOLÓGICO DE CANALIZACIÓN\nPaciente: ${nombre}\n\n` +
    `${cuerpo || 'Sin información seleccionada disponible en el periodo.'}\n\n` +
    `Este informe reúne la información que el terapeuta de origen decidió compartir sobre el proceso. No constituye diagnóstico.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && cuerpo) {
    const ai = crearNoemaAi({ apiKey });
    const r = await ai.generar({
      audiencia: 'clinico',
      instruccion:
        'Redacta un INFORME PSICOLÓGICO DE CANALIZACIÓN profesional, dirigido al terapeuta que recibirá a este paciente. ' +
        'Organízalo con estos encabezados en este orden: "Motivo de la canalización", "Panorama del proceso" (qué se ha observado y trabajado a lo largo del acompañamiento), ' +
        '"Temas y objetivos abordados", "Evolución y estado actual" (a partir de tendencias, registros y notas), y "Focos sugeridos para la continuidad". ' +
        'Escribe en tono clínico, claro y respetuoso. Básate únicamente en los datos proporcionados; formula los puntos de atención como observaciones y preguntas abiertas, ' +
        'sin diagnosticar, sin interpretar causas y sin etiquetar. No inventes información que no esté en los datos. Si falta información para una sección, indícalo brevemente.',
      datos: `Paciente: ${nombre}.\n${cuerpo}`,
      maxTokens: 900,
      temperatura: 0.5,
    });
    if (r.ok && r.texto) texto = r.texto;
  }

  return { texto, datos };
}
