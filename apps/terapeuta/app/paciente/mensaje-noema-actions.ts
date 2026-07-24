'use server';

import { revalidatePath } from 'next/cache';
import { crearNoemaAi } from '@noema/ai';
import type { Json } from '@noema/database';
import { createClient } from '@/lib/supabase/server';

export interface MensajeNoema {
  id: string;
  texto: string;
  generado_at: string;
}

/** Cuántos días de registros mira para escribir el mensaje. */
const DIAS_VENTANA = 10;

/**
 * Devuelve el mensaje de NOEMA de hoy; si no existe, lo genera (R2 · punto 5).
 *
 * Reglas de seguridad y de costo:
 * - Máximo UNO por paciente por día (evita gasto y saturación).
 * - Si no hay registros suficientes, no llama al modelo.
 * - Si el paciente está en riesgo alto/crítico, NO genera texto automático:
 *   devuelve el acompañamiento canónico para que se apoye en su terapeuta.
 * - Usa solo los datos del propio paciente y nunca los comparte con nadie más.
 */
export async function obtenerMensajeNoemaAction(): Promise<{
  ok: boolean;
  mensaje?: MensajeNoema;
  motivo?: 'sin_datos' | 'riesgo' | 'sin_ia' | 'error';
  texto?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, motivo: 'error' };

  // ── 1. ¿Ya hay uno de hoy? ────────────────────────────────────────────────
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const { data: existente } = await supabase
    .from('mensajes_noema')
    .select('id, texto, generado_at')
    .eq('paciente_id', user.id)
    .gte('generado_at', inicioDia.toISOString())
    .order('generado_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existente) return { ok: true, mensaje: existente as MensajeNoema };

  // ── 2. Riesgo: no automatizamos acompañamiento en riesgo alto/crítico ─────
  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('nivel_riesgo')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  if (vinc?.nivel_riesgo === 'alto' || vinc?.nivel_riesgo === 'critico') {
    return {
      ok: false,
      motivo: 'riesgo',
      texto:
        'En este momento preferimos que te apoyes directamente en tu terapeuta. Escríbele por mensajes o usa el botón de apoyo si lo necesitas ahora.',
    };
  }

  // ── 3. Reunir los registros propios de la última ventana ──────────────────
  const desde = new Date();
  desde.setDate(desde.getDate() - DIAS_VENTANA);

  const { data: registros } = await supabase
    .from('registros_emocionales')
    .select('emocion_principal_key, intensidad, necesidad, registrado_at')
    .eq('paciente_id', user.id)
    .gte('registrado_at', desde.toISOString())
    .order('registrado_at', { ascending: false })
    .limit(40);

  if (!registros || registros.length < 2) {
    return { ok: false, motivo: 'sin_datos' };
  }

  // ── 4. Resumir los datos (no mandamos texto libre del paciente) ───────────
  const resumen = resumirRegistros(registros);

  // ── 5. Generar con IA ─────────────────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, motivo: 'sin_ia' };

  const ai = crearNoemaAi({ apiKey });
  const resultado = await ai.generar({
    instruccion:
      'Escribe un mensaje breve de acompañamiento para esta persona, basado únicamente en los patrones observables de sus propios registros. Nombra lo que ella registró (sin interpretarlo) y cierra con una acción concreta y pequeña que pueda hacer hoy.',
    datos: resumen.texto,
    maxTokens: 220,
  });

  if (!resultado.ok) {
    // Guardamos igual la respuesta canónica para no reintentar en bucle.
    if (resultado.motivo === 'error') return { ok: false, motivo: 'error' };
    const { data: guardado } = await supabase
      .from('mensajes_noema')
      .insert({
        paciente_id: user.id,
        texto: resultado.texto,
        basado_en: resumen.datos,
        origen: 'fallback',
      })
      .select('id, texto, generado_at')
      .single();
    return guardado
      ? { ok: true, mensaje: guardado as MensajeNoema }
      : { ok: false, motivo: 'error' };
  }

  const { data: guardado } = await supabase
    .from('mensajes_noema')
    .insert({
      paciente_id: user.id,
      texto: resultado.texto,
      basado_en: resumen.datos,
      modelo: resultado.modelo,
      origen: 'ia',
    })
    .select('id, texto, generado_at')
    .single();

  if (!guardado) return { ok: false, motivo: 'error' };

  revalidatePath('/paciente');
  return { ok: true, mensaje: guardado as MensajeNoema };
}

/** Marca el mensaje como visto. */
export async function marcarMensajeNoemaVistoAction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('mensajes_noema')
    .update({ visto_at: new Date().toISOString() })
    .eq('id', id)
    .eq('paciente_id', user.id);
}

// ---------------------------------------------------------------------------

interface RegistroMinimo {
  emocion_principal_key: string;
  intensidad: number;
  necesidad: string | null;
  registrado_at: string;
}

/**
 * Convierte los registros en un resumen de patrones observables.
 * Solo datos duros: qué emociones, con qué intensidad, en qué momento del día
 * y qué necesidades marcó. Nada de texto libre ni de interpretación.
 */
function resumirRegistros(registros: RegistroMinimo[]): {
  texto: string;
  datos: Json;
} {
  const conteoEmocion: Record<string, number> = {};
  const conteoNecesidad: Record<string, number> = {};
  const franjas: Record<string, number> = { mañana: 0, tarde: 0, noche: 0 };
  let sumaIntensidad = 0;

  for (const r of registros) {
    conteoEmocion[r.emocion_principal_key] = (conteoEmocion[r.emocion_principal_key] ?? 0) + 1;
    if (r.necesidad) conteoNecesidad[r.necesidad] = (conteoNecesidad[r.necesidad] ?? 0) + 1;
    sumaIntensidad += r.intensidad;

    const hora = new Date(r.registrado_at).getHours();
    const franja = hora < 12 ? 'mañana' : hora < 19 ? 'tarde' : 'noche';
    franjas[franja] = (franjas[franja] ?? 0) + 1;
  }

  const top = (obj: Record<string, number>, n: number) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);

  const emociones = top(conteoEmocion, 3);
  const necesidades = top(conteoNecesidad, 2);
  const franjaTop = top(franjas, 1)[0];
  const intensidadMedia = Math.round((sumaIntensidad / registros.length) * 10) / 10;

  const lineas = [
    `Registros en los últimos ${DIAS_VENTANA} días: ${registros.length}.`,
    `Emociones más registradas: ${emociones.map(([e, n]) => `${e.replace(/_/g, ' ')} (${n} veces)`).join(', ')}.`,
    `Intensidad promedio: ${intensidadMedia} de 5.`,
    franjaTop ? `Momento del día con más registros: ${franjaTop[0]}.` : '',
    necesidades.length
      ? `Necesidades que marcó: ${necesidades.map(([e, n]) => `${e} (${n})`).join(', ')}.`
      : '',
  ].filter(Boolean);

  return {
    texto: lineas.join('\n'),
    datos: {
      total: registros.length,
      emociones: Object.fromEntries(emociones),
      necesidades: Object.fromEntries(necesidades),
      intensidad_promedio: intensidadMedia,
      franja_frecuente: franjaTop?.[0] ?? null,
      dias_ventana: DIAS_VENTANA,
    },
  };
}
