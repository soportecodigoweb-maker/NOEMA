'use server';

import { crearNoemaAi } from '@noema/ai';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Json } from '@noema/database';
import { createClient } from '@/lib/supabase/server';

export interface PuntoSerie {
  dia: string; // 'DD/MM'
  intensidad: number; // promedio del día (0 si no hubo)
  registros: number;
}
export interface SegmentoEmocion {
  label: string;
  valor: number;
  color: string;
}
export interface ItemMarcado {
  fecha: string;
  emocion: string;
  intensidad: number;
  detonante: string | null;
  descripcion: string | null;
}
export interface ItemDiario {
  fecha: string;
  titulo: string | null;
  contenido: string;
}
export interface ItemTarea {
  titulo: string;
  estado: string;
  respuestas: number;
  dificultadMedia: number | null;
  ultimoTexto: string | null;
}

export interface ResumenData {
  ok: boolean;
  error?: string;
  nombre: string;
  dias: number;
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  metricas: {
    registros: number;
    marcados: number;
    intensidadProm: number | null;
    deltaIntensidad: number | null;
    adherenciaPct: number | null;
    tareasCompletadas: number;
    tareasTotal: number;
    diario: number;
  };
  serie: PuntoSerie[];
  distribucion: SegmentoEmocion[];
  marcadosSesion: ItemMarcado[];
  diarioSesion: ItemDiario[];
  tareas: ItemTarea[];
  planPrevio: string | null;
  narrativa: string | null; // síntesis IA (o null si no disponible)
}

// Paleta para el donut de emociones (colores de emoción de NOEMA + neutros).
const PALETA_EMOCION = ['#3D4D3E', '#D9B98C', '#E8B5AB', '#B9C9CC', '#C7D2BD', '#F0C9AE', '#B85450'];

export async function generarResumenAction(
  vinculacionId: string,
  desdeArg?: string,
  hastaArg?: string,
): Promise<ResumenData> {
  // Rango de fechas (YYYY-MM-DD). Por defecto: últimos 7 días (incluye hoy).
  // Acepta un solo día (desde === hasta).
  let hasta = (hastaArg ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  let desde = (
    desdeArg ?? new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  ).slice(0, 10);
  if (desde > hasta) [desde, hasta] = [hasta, desde];
  const desdeD = new Date(desde + 'T00:00:00.000Z');
  const hastaD = new Date(hasta + 'T00:00:00.000Z');
  const dias = Math.max(1, Math.round((hastaD.getTime() - desdeD.getTime()) / 86400000) + 1);
  const desdeISO = desde + 'T00:00:00.000Z';
  const hastaISO = hasta + 'T23:59:59.999Z';

  const vacio = baseVacia(dias, desde, hasta);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...vacio, error: 'Sesión expirada.' };

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, paciente_id')
    .eq('id', vinculacionId)
    .single();
  if (!vinc?.paciente_id) return { ...vacio, error: 'No hay paciente vinculado.' };

  const pacienteId = vinc.paciente_id;

  const [
    { data: paciente },
    { data: registros },
    { data: diario },
    { data: tareas },
    { data: sesionPrev },
    { data: emociones },
  ] = await Promise.all([
    supabase.from('profiles').select('nombre').eq('id', pacienteId).maybeSingle(),
    supabase
      .from('registros_emocionales')
      .select('fecha, hora, registrado_at, emocion_principal_key, intensidad, situacion_detonante, descripcion, privacidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('registrado_at', { ascending: true }),
    supabase
      .from('diario_entradas')
      .select('fecha, titulo, contenido, privacidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false }),
    supabase
      .from('tareas')
      .select('titulo, estado, respuestas:tarea_respuestas(texto_libre, dificultad_percibida, compartir_terapeuta, creado_at)')
      .eq('vinculacion_id', vinculacionId)
      .in('estado', ['pendiente', 'en_progreso', 'completada']),
    supabase
      .from('sesiones')
      .select('nota:sesion_notas(plan_proxima_sesion)')
      .eq('vinculacion_id', vinculacionId)
      .eq('estado', 'realizada')
      .order('fecha_programada', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('emociones_catalogo').select('key, nombre_es'),
  ]);

  const nombreEmocion = new Map((emociones ?? []).map((e) => [e.key, e.nombre_es]));
  const regs = registros ?? [];
  const nombre = paciente?.nombre ?? 'el paciente';

  // ── Serie por día ──
  const serie: PuntoSerie[] = [];
  const sumaPorDia = new Map<string, { suma: number; n: number }>();
  for (const r of regs) {
    const k = r.fecha;
    const e = sumaPorDia.get(k) ?? { suma: 0, n: 0 };
    e.suma += r.intensidad;
    e.n += 1;
    sumaPorDia.set(k, e);
  }
  for (let i = 0; i < dias; i++) {
    const d = new Date(desdeD.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const e = sumaPorDia.get(key);
    serie.push({
      dia: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
      intensidad: e ? Math.round((e.suma / e.n) * 10) / 10 : 0,
      registros: e?.n ?? 0,
    });
  }

  // ── Distribución de emociones ──
  const conteo = new Map<string, number>();
  for (const r of regs) conteo.set(r.emocion_principal_key, (conteo.get(r.emocion_principal_key) ?? 0) + 1);
  const distribucion: SegmentoEmocion[] = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, n], i) => ({
      label: nombreEmocion.get(k) ?? k.replace(/_/g, ' '),
      valor: n,
      color: PALETA_EMOCION[i % PALETA_EMOCION.length]!,
    }));

  // ── Métricas ──
  const intensidadProm = regs.length ? Math.round((regs.reduce((s, r) => s + r.intensidad, 0) / regs.length) * 10) / 10 : null;
  // Tendencia: promedio 2da mitad vs 1ra mitad
  const mitad = Math.floor(regs.length / 2);
  const prom = (arr: typeof regs) => (arr.length ? arr.reduce((s, r) => s + r.intensidad, 0) / arr.length : 0);
  const promIni = prom(regs.slice(0, mitad));
  const promFin = prom(regs.slice(mitad));
  const deltaIntensidad = regs.length >= 4 && promIni > 0 ? Math.round(((promFin - promIni) / promIni) * 100) : null;

  const marcadosSesion: ItemMarcado[] = regs
    .filter((r) => r.privacidad === 'marcado_sesion')
    .reverse()
    .slice(0, 8)
    .map((r) => ({
      fecha: r.fecha,
      emocion: nombreEmocion.get(r.emocion_principal_key) ?? r.emocion_principal_key,
      intensidad: r.intensidad,
      detonante: r.situacion_detonante,
      descripcion: r.descripcion,
    }));

  const diarioSesion: ItemDiario[] = (diario ?? []).slice(0, 5).map((d) => ({
    fecha: d.fecha,
    titulo: d.titulo,
    contenido: (d.contenido ?? '').slice(0, 400),
  }));

  const tareasList = tareas ?? [];
  const tareasCompletadas = tareasList.filter((t) => t.estado === 'completada').length;
  const adherenciaPct = tareasList.length ? Math.round((tareasCompletadas / tareasList.length) * 100) : null;
  const tareasResumen: ItemTarea[] = tareasList.map((t) => {
    const resps = (t.respuestas ?? []).filter((r) => r.compartir_terapeuta);
    const difs = resps.map((r) => r.dificultad_percibida).filter((x): x is number => x != null);
    const ult = [...resps].sort((a, b) => (b.creado_at ?? '').localeCompare(a.creado_at ?? '')).find((r) => r.texto_libre);
    return {
      titulo: t.titulo,
      estado: t.estado,
      respuestas: resps.length,
      dificultadMedia: difs.length ? Math.round((difs.reduce((s, x) => s + x, 0) / difs.length) * 10) / 10 : null,
      ultimoTexto: ult?.texto_libre ?? null,
    };
  });

  const notaPrev = sesionPrev?.nota as { plan_proxima_sesion?: string }[] | { plan_proxima_sesion?: string } | null;
  const planPrevio = (Array.isArray(notaPrev) ? notaPrev[0]?.plan_proxima_sesion : notaPrev?.plan_proxima_sesion) ?? null;

  // ── Señales de actividad/compromiso (agregados; sin exponer contenido privado) ──
  let metasCreadas = 0;
  let metasCompletadas = 0;
  let mensajesPaciente = 0;
  {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const urlAdmin = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (serviceKey && urlAdmin) {
      const admin = createAdminClient(urlAdmin, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const [mTot, mOk, msg] = await Promise.all([
        admin.from('recordatorios_personales').select('*', { count: 'exact', head: true }).eq('paciente_id', pacienteId).gte('creado_at', desdeISO).lte('creado_at', hastaISO),
        admin.from('recordatorios_personales').select('*', { count: 'exact', head: true }).eq('paciente_id', pacienteId).eq('completado', true).gte('creado_at', desdeISO).lte('creado_at', hastaISO),
        admin.from('mensajes').select('*', { count: 'exact', head: true }).eq('vinculacion_id', vinculacionId).eq('autor_id', pacienteId).eq('es_sistema', false).gte('creado_at', desdeISO).lte('creado_at', hastaISO),
      ]);
      metasCreadas = mTot.count ?? 0;
      metasCompletadas = mOk.count ?? 0;
      mensajesPaciente = msg.count ?? 0;
    }
  }
  const diasActivos = serie.filter((p) => p.registros > 0).length;

  // ── Análisis pre-sesión con IA (respeta guardarraíles clínicos) ──
  let narrativa: string | null = null;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && regs.length >= 2) {
    const comentariosTareas = tareasResumen
      .filter((t) => t.ultimoTexto)
      .map((t) => `"${(t.ultimoTexto ?? '').slice(0, 120)}"`)
      .join('; ');

    // Detalle de CADA registro compartido, con hora y descripción íntegra: es el
    // material más valioso para detectar personas, lugares, horarios, objetos,
    // actividades y pensamientos que se repiten.
    const registrosDetalle = regs
      .map((r) => {
        const hh = (r.hora ?? '').slice(0, 5);
        const emo = nombreEmocion.get(r.emocion_principal_key) ?? r.emocion_principal_key;
        return `- [${r.fecha}${hh ? ' ' + hh : ''}] ${emo} (int. ${r.intensidad}/5)${
          r.situacion_detonante ? ` | situación: ${r.situacion_detonante}` : ''
        }${r.descripcion ? ` | descripción: ${r.descripcion.slice(0, 500)}` : ''}`;
      })
      .join('\n');

    const datosIA = [
      `Periodo analizado: del ${desde} al ${hasta} (${dias} día${dias > 1 ? 's' : ''}).`,
      `Registros emocionales compartidos: ${regs.length}, en ${diasActivos} de ${dias} día(s). Intensidad promedio: ${intensidadProm ?? '—'}/5.`,
      deltaIntensidad !== null
        ? `Tendencia de intensidad (2da mitad vs 1ra): ${deltaIntensidad > 0 ? '+' : ''}${deltaIntensidad}%.`
        : '',
      `Emociones más frecuentes: ${distribucion.map((d) => `${d.label} (${d.valor})`).join(', ') || 'sin datos'}.`,
      `Intensidad por día (antiguo → reciente): ${serie.map((p) => p.intensidad).join(', ')}.`,
      `\nTODOS LOS REGISTROS, UNO POR UNO (revisa CADA descripción con máxima atención — no te quedes en la emoción; en la descripción hay personas, lugares, horarios, objetos, actividades, pensamientos y situaciones):\n${registrosDetalle || 'sin registros compartidos'}`,
      diarioSesion.length
        ? `\nDiario compartido (${diarioSesion.length} entradas): ${diarioSesion
            .map((d) => `[${d.fecha}] ${d.titulo ? d.titulo + ': ' : ''}${d.contenido.slice(0, 300)}`)
            .join(' | ')}.`
        : '',
      `\nTareas: ${tareasCompletadas}/${tareasList.length} completadas${adherenciaPct !== null ? ` (adherencia ${adherenciaPct}%)` : ''}.${comentariosTareas ? ` Comentarios del paciente en tareas: ${comentariosTareas}.` : ''}`,
      `Metas personales: creó ${metasCreadas} y completó ${metasCompletadas}${metasCreadas ? ` (${Math.round((metasCompletadas / metasCreadas) * 100)}%)` : ''}.`,
      `Comunicación: envió ${mensajesPaciente} mensaje(s) al terapeuta en el periodo.`,
    ]
      .filter(Boolean)
      .join('\n');

    const ai = crearNoemaAi({ apiKey });
    const r = await ai.generar({
      audiencia: 'clinico',
      instruccion:
        'Genera un resumen objetivo de los registros del paciente. Identifica emociones predominantes, cambios relevantes y posibles observaciones de interés. Busca coincidencias repetidas entre emociones y situaciones, horarios, personas, lugares, objetos, actividades o pensamientos. No interpretes, no diagnostiques ni establezcas relaciones causales; únicamente describe patrones observados que puedan ser útiles para la exploración clínica y sugiere preguntas abiertas para la siguiente sesión.\n\n' +
        'Antes de elaborar el resumen, revisa TODOS los registros uno por uno —sobre todo sus DESCRIPCIONES, donde suele haber la información más valiosa— e identifica cualquier elemento repetido. Cuenta explícitamente la frecuencia con la que aparecen personas, objetos, lugares, horarios, actividades, pensamientos y situaciones. Después utiliza ese conteo para generar las observaciones. No omitas elementos repetidos aunque parezcan poco relevantes.\n\n' +
        'Considera también la actividad y el compromiso (constancia de registros, metas creadas vs. cumplidas, adherencia a tareas, frecuencia de mensajes) como observaciones, sin juzgar.',
      datos: datosIA,
      maxTokens: 1200,
      temperatura: 0.4,
    });
    if (r.ok) narrativa = r.texto;
  }

  const resultado: ResumenData = {
    ok: true,
    nombre,
    dias,
    desde,
    hasta,
    metricas: {
      registros: regs.length,
      marcados: marcadosSesion.length,
      intensidadProm,
      deltaIntensidad,
      adherenciaPct,
      tareasCompletadas,
      tareasTotal: tareasList.length,
      diario: diarioSesion.length,
    },
    serie,
    distribucion,
    marcadosSesion,
    diarioSesion,
    tareas: tareasResumen,
    planPrevio,
    narrativa,
  };

  // Guardar en el historial (solo si hay algo que resumir).
  if (resultado.metricas.registros > 0 || resultado.metricas.diario > 0 || resultado.metricas.tareasTotal > 0) {
    await supabase.from('resumenes_sesion').insert({
      vinculacion_id: vinculacionId,
      terapeuta_id: user.id,
      datos: resultado as unknown as Json,
      narrativa,
      dias,
    });
  }

  return resultado;
}

export interface ResumenGuardado {
  id: string;
  generado_at: string;
  narrativa: string | null;
}

/** Lista los resúmenes guardados de un paciente (historial). */
export async function listarResumenesAction(vinculacionId: string): Promise<ResumenGuardado[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('resumenes_sesion')
    .select('id, generado_at, narrativa')
    .eq('vinculacion_id', vinculacionId)
    .order('generado_at', { ascending: false })
    .limit(30);
  return (data as ResumenGuardado[] | null) ?? [];
}

/** Recupera un resumen guardado por id para volver a mostrarlo. */
export async function obtenerResumenAction(id: string): Promise<ResumenData | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('resumenes_sesion')
    .select('datos')
    .eq('id', id)
    .maybeSingle();
  if (!data?.datos) return null;
  return data.datos as unknown as ResumenData;
}

function baseVacia(dias: number, desde?: string, hasta?: string): ResumenData {
  return {
    ok: false,
    nombre: '',
    dias,
    desde,
    hasta,
    metricas: {
      registros: 0,
      marcados: 0,
      intensidadProm: null,
      deltaIntensidad: null,
      adherenciaPct: null,
      tareasCompletadas: 0,
      tareasTotal: 0,
      diario: 0,
    },
    serie: [],
    distribucion: [],
    marcadosSesion: [],
    diarioSesion: [],
    tareas: [],
    planPrevio: null,
    narrativa: null,
  };
}
