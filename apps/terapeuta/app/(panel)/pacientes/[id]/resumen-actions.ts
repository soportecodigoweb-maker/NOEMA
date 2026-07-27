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
  dias = 14,
): Promise<ResumenData> {
  const vacio = baseVacia(dias);
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
  const desdeDate = new Date(Date.now() - dias * 86400000);
  const desde = desdeDate.toISOString().slice(0, 10);

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
      .select('fecha, registrado_at, emocion_principal_key, intensidad, situacion_detonante, descripcion, privacidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
      .order('registrado_at', { ascending: true }),
    supabase
      .from('diario_entradas')
      .select('fecha, titulo, contenido, privacidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
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
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const e = sumaPorDia.get(key);
    serie.push({
      dia: `${d.getDate()}/${d.getMonth() + 1}`,
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
      const desdeISO = desdeDate.toISOString();
      const [mTot, mOk, msg] = await Promise.all([
        admin.from('recordatorios_personales').select('*', { count: 'exact', head: true }).eq('paciente_id', pacienteId).gte('creado_at', desdeISO),
        admin.from('recordatorios_personales').select('*', { count: 'exact', head: true }).eq('paciente_id', pacienteId).eq('completado', true).gte('creado_at', desdeISO),
        admin.from('mensajes').select('*', { count: 'exact', head: true }).eq('vinculacion_id', vinculacionId).eq('autor_id', pacienteId).eq('es_sistema', false).gte('creado_at', desdeISO),
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
    const datosIA = [
      `Periodo analizado: últimos ${dias} días.`,
      `Registros emocionales compartidos: ${regs.length}, repartidos en ${diasActivos} de ${dias} días. Intensidad promedio: ${intensidadProm ?? '—'}/5.`,
      deltaIntensidad !== null
        ? `Tendencia de intensidad (2da mitad vs 1ra): ${deltaIntensidad > 0 ? '+' : ''}${deltaIntensidad}%.`
        : '',
      `Emociones más frecuentes: ${distribucion.map((d) => `${d.label} (${d.valor})`).join(', ') || 'sin datos'}.`,
      `Intensidad por día (antiguo → reciente): ${serie.map((p) => p.intensidad).join(', ')}.`,
      marcadosSesion.length
        ? `El paciente MARCÓ para hablar en sesión: ${marcadosSesion
            .map((r) => `${r.emocion} (int. ${r.intensidad}/5)${r.detonante ? `, detonante: "${r.detonante}"` : ''}${r.descripcion ? `, nota: "${r.descripcion.slice(0, 120)}"` : ''}`)
            .join('; ')}.`
        : 'El paciente no marcó registros específicos para sesión.',
      diarioSesion.length
        ? `Diario compartido (${diarioSesion.length} entradas): ${diarioSesion
            .map((d) => `[${d.fecha}] ${d.titulo ? d.titulo + ': ' : ''}${d.contenido.slice(0, 180)}`)
            .join(' | ')}.`
        : '',
      `Tareas: ${tareasCompletadas}/${tareasList.length} completadas${adherenciaPct !== null ? ` (adherencia ${adherenciaPct}%)` : ''}.${comentariosTareas ? ` Comentarios del paciente en tareas: ${comentariosTareas}.` : ''}`,
      `Metas personales: creó ${metasCreadas} y completó ${metasCompletadas}${metasCreadas ? ` (${Math.round((metasCompletadas / metasCreadas) * 100)}%)` : ''}.`,
      `Comunicación: envió ${mensajesPaciente} mensaje(s) al terapeuta en el periodo.`,
    ]
      .filter(Boolean)
      .join('\n');

    const ai = crearNoemaAi({ apiKey });
    const r = await ai.generar({
      audiencia: 'clinico',
      instruccion:
        'Analiza estos datos observables del paciente y prepara el análisis pre-sesión para el terapeuta. ' +
        'Detecta emociones recurrentes, patrones, relaciones entre detonantes y emociones, tendencias, y señales de ' +
        'conducta/compromiso (constancia de uso, metas creadas vs cumplidas, adherencia a tareas, frecuencia de mensajes). ' +
        'Sé perspicaz: resalta lo que podría pasar desapercibido. No diagnostiques ni interpretes causas.',
      datos: datosIA,
      maxTokens: 1000,
      temperatura: 0.5,
    });
    if (r.ok) narrativa = r.texto;
  }

  const resultado: ResumenData = {
    ok: true,
    nombre,
    dias,
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

function baseVacia(dias: number): ResumenData {
  return {
    ok: false,
    nombre: '',
    dias,
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
