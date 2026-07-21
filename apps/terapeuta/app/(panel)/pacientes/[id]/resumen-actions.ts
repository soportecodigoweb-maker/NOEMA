'use server';

import { createClient } from '@/lib/supabase/server';
import { formatFecha } from '@/lib/utils';

interface ResumenResult {
  ok: boolean;
  resumen_md?: string;
  meta?: { registros: number; diario: number; dias: number };
  error?: string;
}

/**
 * Resumen pre-sesión generado de DATOS DUROS del paciente (sin IA) (#12).
 * Reúne lo compartido/marcado para sesión de los últimos N días.
 */
export async function generarResumenAction(
  vinculacionId: string,
  dias = 14,
): Promise<ResumenResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sesión expirada.' };

  // Vinculación → paciente
  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, paciente_id')
    .eq('id', vinculacionId)
    .single();
  if (!vinc?.paciente_id) return { ok: false, error: 'No hay paciente vinculado.' };

  const pacienteId = vinc.paciente_id;
  const desde = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);

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
      .select('fecha, emocion_principal_key, intensidad, situacion_detonante, descripcion, privacidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
      .order('fecha', { ascending: false }),
    supabase
      .from('diario_entradas')
      .select('fecha, titulo, contenido, privacidad')
      .eq('paciente_id', pacienteId)
      .eq('privacidad', 'marcado_sesion')
      .gte('fecha', desde)
      .order('fecha', { ascending: false }),
    supabase
      .from('tareas')
      .select('titulo, estado, respuestas:tarea_respuestas(texto_libre, dificultad_percibida, compartir_terapeuta)')
      .eq('vinculacion_id', vinculacionId)
      .in('estado', ['pendiente', 'en_progreso', 'completada']),
    supabase
      .from('sesiones')
      .select('fecha_realizada, nota:sesion_notas(plan_proxima_sesion)')
      .eq('vinculacion_id', vinculacionId)
      .eq('estado', 'realizada')
      .order('fecha_programada', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('emociones_catalogo').select('key, nombre_es, familia'),
  ]);

  const nombreEmocion = new Map((emociones ?? []).map((e) => [e.key, e]));
  const regs = registros ?? [];

  // Emociones más frecuentes
  const conteo = new Map<string, number>();
  for (const r of regs) conteo.set(r.emocion_principal_key, (conteo.get(r.emocion_principal_key) ?? 0) + 1);
  const topEmociones = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k, n]) => `${nombreEmocion.get(k)?.nombre_es ?? k} (${n})`);

  const intensidadProm =
    regs.length > 0 ? (regs.reduce((s, r) => s + r.intensidad, 0) / regs.length).toFixed(1) : '—';

  const marcadosSesion = regs.filter((r) => r.privacidad === 'marcado_sesion');

  // Construir markdown
  const nombre = paciente?.nombre ?? 'el paciente';
  let md = `# Resumen pre-sesión — ${nombre}\n\n`;
  md += `Periodo: últimos ${dias} días.\n\n`;

  md += `## Panorama emocional\n`;
  md += `- Registros compartidos: **${regs.length}**\n`;
  md += `- Intensidad promedio: **${intensidadProm}/5**\n`;
  if (topEmociones.length) md += `- Emociones más frecuentes: ${topEmociones.join(', ')}\n`;
  md += `\n`;

  if (marcadosSesion.length > 0) {
    md += `## Marcado para hablar en sesión (${marcadosSesion.length})\n`;
    for (const r of marcadosSesion.slice(0, 6)) {
      const emo = nombreEmocion.get(r.emocion_principal_key)?.nombre_es ?? r.emocion_principal_key;
      md += `> **${formatFecha(r.fecha)}** — ${emo} (int. ${r.intensidad}/5)`;
      if (r.situacion_detonante) md += ` · Detonante: ${r.situacion_detonante}`;
      md += `\n`;
      if (r.descripcion) md += `> ${r.descripcion}\n`;
      md += `\n`;
    }
  }

  if (diario && diario.length > 0) {
    md += `## Diario marcado para sesión (${diario.length})\n`;
    for (const d of diario.slice(0, 4)) {
      md += `> **${formatFecha(d.fecha)}**${d.titulo ? ` — ${d.titulo}` : ''}\n`;
      md += `> ${(d.contenido ?? '').slice(0, 240)}\n\n`;
    }
  }

  const tareasList = tareas ?? [];
  if (tareasList.length > 0) {
    md += `## Tareas\n`;
    for (const t of tareasList) {
      const resps = (t.respuestas ?? []).filter((r) => r.compartir_terapeuta);
      md += `- **${t.titulo}** (${t.estado})`;
      if (resps.length) {
        const difs = resps.map((r) => r.dificultad_percibida).filter((x): x is number => x != null);
        if (difs.length) {
          const avg = (difs.reduce((s, x) => s + x, 0) / difs.length).toFixed(1);
          md += ` — ${resps.length} respuesta(s), dificultad media ${avg}/5`;
        }
      }
      md += `\n`;
      const ultima = resps.find((r) => r.texto_libre);
      if (ultima?.texto_libre) md += `  > "${ultima.texto_libre.slice(0, 160)}"\n`;
    }
    md += `\n`;
  }

  const planPrev = (sesionPrev?.nota as { plan_proxima_sesion?: string }[] | { plan_proxima_sesion?: string } | null);
  const plan = Array.isArray(planPrev) ? planPrev[0]?.plan_proxima_sesion : planPrev?.plan_proxima_sesion;
  if (plan) {
    md += `## Plan de la sesión anterior\n> ${plan}\n\n`;
  }

  if (regs.length === 0 && (!diario || diario.length === 0) && tareasList.length === 0) {
    md += `_El paciente no ha compartido registros ni marcado contenido para esta sesión en el periodo._\n`;
  }

  return {
    ok: true,
    resumen_md: md,
    meta: { registros: regs.length, diario: diario?.length ?? 0, dias },
  };
}
