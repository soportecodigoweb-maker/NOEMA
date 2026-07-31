'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js';
import { crearNoemaAi } from '@noema/ai';
import type { Database } from '@noema/database';
import { createClient } from '@/lib/supabase/server';

function admin(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface IncluirInforme {
  tendencias: boolean;
  tareas: boolean;
}

/** Reúne datos del paciente y arma un resumen breve orientado a él (con IA). */
async function construirInformePaciente(
  db: SupabaseClient<Database>,
  pacienteId: string,
  vinculacionId: string,
  incluir: IncluirInforme,
): Promise<string> {
  const desde = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const partes: string[] = [];

  const { data: pac } = await db.from('profiles').select('nombre').eq('id', pacienteId).maybeSingle();
  const nombre = pac?.nombre ?? 'la persona';

  if (incluir.tendencias) {
    const { data: catalogo } = await db.from('emociones_catalogo').select('key, nombre_es');
    const nombreEmocion = new Map((catalogo ?? []).map((e) => [e.key, e.nombre_es]));
    const { data: regs } = await db
      .from('registros_emocionales')
      .select('emocion_principal_key, intensidad')
      .eq('paciente_id', pacienteId)
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('fecha', desde)
      .limit(200);
    const r = regs ?? [];
    if (r.length) {
      const prom = Math.round((r.reduce((s, x) => s + x.intensidad, 0) / r.length) * 10) / 10;
      const conteo = new Map<string, number>();
      for (const x of r) conteo.set(x.emocion_principal_key, (conteo.get(x.emocion_principal_key) ?? 0) + 1);
      const top = [...conteo.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([k, n]) => `${nombreEmocion.get(k) ?? k} (${n})`)
        .join(', ');
      partes.push(
        `Registros emocionales (últimos 60 días): ${r.length}. Intensidad promedio: ${prom}/5. Emociones más frecuentes: ${top}.`,
      );
    }
  }

  if (incluir.tareas) {
    const { data: tareas } = await db
      .from('tareas')
      .select('estado')
      .eq('vinculacion_id', vinculacionId)
      .limit(100);
    const t = tareas ?? [];
    if (t.length) {
      const comp = t.filter((x) => x.estado === 'completada').length;
      partes.push(`Tareas asignadas: ${t.length}, completadas: ${comp}.`);
    }
  }

  const cuerpo = partes.join('\n');
  const base = `Resumen para ${nombre}:\n${cuerpo || 'Aún hay poca información registrada en este periodo.'}`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && cuerpo) {
    const ai = crearNoemaAi({ apiKey });
    const r = await ai.generar({
      audiencia: 'paciente',
      instruccion:
        'Escribe un mensaje breve, cálido y claro dirigido directamente al paciente (de "tú"), a modo de devolución de su terapeuta sobre su proceso reciente en NOEMA. ' +
        'Destaca lo más relevante y positivo, los avances y los patrones que se observan en sus registros, de forma comprensible y alentadora. ' +
        'No emitas diagnósticos ni interpretes causas; habla de observaciones. Cierra con una nota de acompañamiento. Máximo 2 párrafos.',
      datos: base,
      maxTokens: 420,
      temperatura: 0.6,
    });
    if (r.ok && r.texto) return r.texto;
  }
  return base;
}

/** Genera el borrador del informe para el paciente. No lo comparte todavía. */
export async function generarInformePacienteAction(
  vinculacionId: string,
  incluir: IncluirInforme,
): Promise<{ ok: boolean; error?: string; borrador?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const db = admin();
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('paciente_id, terapeuta_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc || vinc.terapeuta_id !== user.id) {
    return { ok: false, error: 'No tienes acceso a este paciente.' };
  }
  if (!vinc.paciente_id) return { ok: false, error: 'La vinculación no tiene paciente.' };

  const borrador = await construirInformePaciente(db, vinc.paciente_id, vinculacionId, incluir);
  return { ok: true, borrador };
}

/** Comparte el informe (ya revisado) con el paciente y le avisa. */
export async function compartirInformePacienteAction(
  vinculacionId: string,
  titulo: string,
  contenido: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (!titulo.trim() || !contenido.trim()) {
    return { ok: false, error: 'Escribe un título y el contenido del informe.' };
  }

  const { error } = await supabase.from('informes_paciente').insert({
    vinculacion_id: vinculacionId,
    titulo: titulo.trim(),
    contenido: contenido.trim(),
    creado_por: user.id,
  });
  if (error) return { ok: false, error: 'No se pudo compartir el informe.' };

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('paciente_id')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (vinc?.paciente_id) {
    await admin().from('notificaciones').insert({
      destinatario_id: vinc.paciente_id,
      tipo: 'informe',
      titulo: 'Tu terapeuta compartió un informe contigo',
      cuerpo: `Tienes un nuevo informe para leer: ${titulo.trim()}.`,
      vinculacion_id: vinculacionId,
      url: '/paciente/documentos',
    });
  }

  revalidatePath(`/pacientes/${vinculacionId}/documentos`);
  return { ok: true };
}

/** Elimina un informe compartido. */
export async function eliminarInformePacienteAction(
  id: string,
  vinculacionId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from('informes_paciente').delete().eq('id', id);
  if (error) return { ok: false };
  revalidatePath(`/pacientes/${vinculacionId}/documentos`);
  return { ok: true };
}
