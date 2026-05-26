/**
 * Edge Function: generar-resumen
 *
 * Genera un resumen pre-sesión con Claude a partir de los registros
 * emocionales y entradas de diario que el paciente COMPARTIÓ con su terapeuta.
 *
 * GUARDRAILS:
 *   1. Verifica que quien llama sea un terapeuta autenticado dueño de la vinculación.
 *   2. SOLO lee filas con privacidad in ('compartido', 'marcado_sesion').
 *      NUNCA toca 'privado'.
 *   3. El system prompt instruye explícitamente a Claude que no diagnostique,
 *      no patologice y siempre cite la evidencia textual.
 *   4. Guarda el resumen completo en `resumenes_ia` para auditoría.
 *   5. Devuelve tanto JSON estructurado como Markdown legible.
 *
 * POST /functions/v1/generar-resumen
 * Body: { vinculacion_id: string, dias?: number = 14 }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2.47.10';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

interface RequestBody {
  vinculacion_id: string;
  dias?: number;
}

interface ResumenJson {
  panorama: string;
  temas: Array<{
    titulo: string;
    descripcion: string;
    evidencia: string[];
    frecuencia: number;
  }>;
  intensidad_media: number;
  picos: Array<{ fecha: string; intensidad: number; emocion: string; nota?: string }>;
  alertas: string[];
  sugerencias_exploracion: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// @ts-ignore - Deno runtime
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // 1. Validar auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Falta token de autenticación.' }, 401);
    }

    // @ts-ignore - Deno.env
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // @ts-ignore
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicKey) {
      return jsonResponse(
        {
          error:
            'IA no configurada. El admin debe definir ANTHROPIC_API_KEY en los secrets de Supabase.',
        },
        503,
      );
    }

    // Cliente con el JWT del usuario (para verificar permisos vía RLS)
    const userClient = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Sesión inválida.' }, 401);
    }

    // Body
    const body: RequestBody = await req.json();
    if (!body.vinculacion_id) {
      return jsonResponse({ error: 'Falta vinculacion_id.' }, 400);
    }
    const dias = body.dias ?? 14;

    // 2. Cliente con service role para queries internas (saltea RLS donde no aplica)
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Verificar que el caller es el terapeuta de esta vinculación
    const { data: vinc, error: vincError } = await admin
      .from('vinculaciones')
      .select('id, terapeuta_id, paciente_id, estado')
      .eq('id', body.vinculacion_id)
      .single();

    if (vincError || !vinc) {
      return jsonResponse({ error: 'Vinculación no encontrada.' }, 404);
    }
    if (vinc.terapeuta_id !== user.id) {
      return jsonResponse({ error: 'No tienes acceso a esta vinculación.' }, 403);
    }
    if (!vinc.paciente_id) {
      return jsonResponse(
        { error: 'La vinculación no tiene paciente activo aún.' },
        400,
      );
    }
    if (vinc.estado !== 'activa') {
      return jsonResponse({ error: 'La vinculación no está activa.' }, 400);
    }

    // 4. Recuperar datos del paciente — SOLO compartido/marcado_sesion
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    const desdeStr = desde.toISOString().slice(0, 10);

    const [{ data: registros }, { data: diario }] = await Promise.all([
      admin
        .from('registros_emocionales')
        .select(
          'fecha, hora, emocion_principal_key, intensidad, descripcion, situacion_detonante, privacidad',
        )
        .eq('paciente_id', vinc.paciente_id)
        .in('privacidad', ['compartido', 'marcado_sesion'])
        .gte('fecha', desdeStr)
        .order('fecha', { ascending: true }),
      admin
        .from('diario_entradas')
        .select('fecha, titulo, contenido, privacidad')
        .eq('paciente_id', vinc.paciente_id)
        .in('privacidad', ['compartido', 'marcado_sesion'])
        .gte('fecha', desdeStr)
        .order('fecha', { ascending: true }),
    ]);

    const totalRegistros = registros?.length ?? 0;
    const totalDiario = diario?.length ?? 0;

    if (totalRegistros + totalDiario === 0) {
      return jsonResponse(
        {
          error:
            'El paciente no ha compartido información en este período. Habla con tu paciente para revisar la configuración de privacidad.',
        },
        400,
      );
    }

    // 5. Construir el prompt
    const systemPrompt = `Eres un asistente para terapeutas profesionales. Tu trabajo es preparar un resumen operativo pre-sesión a partir de la información que el paciente compartió explícitamente con su terapeuta.

REGLAS INVIOLABLES:
1. NO diagnostiques. Nunca uses lenguaje clínico de diagnóstico (depresión mayor, TAG, TLP, etc.).
2. NO patologices conductas normales.
3. NO inventes información. Si no hay evidencia para algo, no lo digas.
4. SIEMPRE cita la evidencia textual del paciente cuando hagas una observación.
5. Tu output es operativo: ayudar al terapeuta a preparar su sesión, no reemplazar su criterio clínico.
6. Usa lenguaje profesional pero accesible, en español de México.
7. SIEMPRE devuelve JSON válido con la estructura exacta solicitada.`;

    const userPrompt = `Genera un resumen pre-sesión para los últimos ${dias} días.

DATOS COMPARTIDOS POR EL PACIENTE:

Registros emocionales (${totalRegistros}):
${(registros ?? [])
  .map(
    (r: any) =>
      `- ${r.fecha} ${r.hora.slice(0, 5)}: ${r.emocion_principal_key} (intensidad ${r.intensidad}/5)${r.descripcion ? `\n  "${r.descripcion}"` : ''}${r.situacion_detonante ? `\n  Detonante: ${r.situacion_detonante}` : ''}${r.privacidad === 'marcado_sesion' ? `\n  ★ Marcado para esta sesión` : ''}`,
  )
  .join('\n')}

Entradas de diario (${totalDiario}):
${(diario ?? [])
  .map(
    (d: any) =>
      `- ${d.fecha}${d.titulo ? ` · ${d.titulo}` : ''}\n  "${d.contenido}"${d.privacidad === 'marcado_sesion' ? `\n  ★ Marcado para esta sesión` : ''}`,
  )
  .join('\n')}

Devuelve SOLO un JSON válido con esta estructura exacta:
{
  "panorama": "2-3 frases con el panorama general del período",
  "temas": [
    {
      "titulo": "tema corto",
      "descripcion": "qué se observa",
      "evidencia": ["cita textual 1", "cita textual 2"],
      "frecuencia": 3
    }
  ],
  "intensidad_media": 3.5,
  "picos": [
    {"fecha": "2024-05-15", "intensidad": 5, "emocion": "ansioso", "nota": "qué pasó"}
  ],
  "alertas": ["frases que requieren atención del terapeuta (si las hay)"],
  "sugerencias_exploracion": ["preguntas abiertas que podrías hacer en sesión"]
}

NO uses bloques de código markdown. Devuelve el JSON puro.`;

    // 6. Llamar a Claude
    const claudeResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude API error:', errText);
      return jsonResponse(
        { error: 'No pudimos generar el resumen. Inténtalo en un momento.' },
        502,
      );
    }

    const claudeData = await claudeResponse.json();
    const rawText = claudeData.content?.[0]?.text ?? '';
    const tokensInput = claudeData.usage?.input_tokens ?? null;
    const tokensOutput = claudeData.usage?.output_tokens ?? null;

    // 7. Parsear JSON (con tolerancia a bloques markdown si Claude se equivoca)
    let resumenJson: ResumenJson;
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      resumenJson = JSON.parse(cleaned);
    } catch {
      console.error('No se pudo parsear:', rawText);
      return jsonResponse(
        { error: 'El modelo devolvió un formato inesperado. Vuelve a intentarlo.' },
        502,
      );
    }

    // 8. Construir versión Markdown legible
    const resumenMd = construirMarkdown(resumenJson, dias);

    // 9. Guardar en histórico
    const { data: guardado, error: insertError } = await admin
      .from('resumenes_ia')
      .insert({
        vinculacion_id: vinc.id,
        generado_por: user.id,
        periodo_desde: desdeStr,
        periodo_hasta: new Date().toISOString().slice(0, 10),
        registros_count: totalRegistros,
        diario_count: totalDiario,
        resumen_json: resumenJson,
        resumen_md: resumenMd,
        modelo: MODEL,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('No se pudo guardar:', insertError);
    }

    return jsonResponse({
      ok: true,
      id: guardado?.id,
      resumen_json: resumenJson,
      resumen_md: resumenMd,
      meta: {
        registros: totalRegistros,
        diario: totalDiario,
        dias,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
      },
    });
  } catch (e) {
    console.error('Error inesperado:', e);
    return jsonResponse({ error: 'Error interno.' }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function construirMarkdown(r: ResumenJson, dias: number): string {
  const lines: string[] = [];
  lines.push(`# Resumen pre-sesión · últimos ${dias} días`);
  lines.push('');
  lines.push(r.panorama);
  lines.push('');

  if (r.temas.length > 0) {
    lines.push('## Temas detectados');
    for (const t of r.temas) {
      lines.push(`### ${t.titulo} _(${t.frecuencia} menciones)_`);
      lines.push(t.descripcion);
      if (t.evidencia.length > 0) {
        for (const ev of t.evidencia) {
          lines.push(`> ${ev}`);
        }
      }
      lines.push('');
    }
  }

  if (r.picos.length > 0) {
    lines.push('## Picos de intensidad');
    for (const p of r.picos) {
      lines.push(`- **${p.fecha}** · ${p.emocion} (${p.intensidad}/5)${p.nota ? ` — ${p.nota}` : ''}`);
    }
    lines.push('');
  }

  if (r.alertas.length > 0) {
    lines.push('## ⚠ Alertas para tu atención');
    for (const a of r.alertas) {
      lines.push(`- ${a}`);
    }
    lines.push('');
  }

  if (r.sugerencias_exploracion.length > 0) {
    lines.push('## Sugerencias de exploración');
    for (const s of r.sugerencias_exploracion) {
      lines.push(`- ${s}`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push(
    '_Generado por IA. Es información operativa, no diagnóstica. Tu criterio profesional manda._',
  );
  return lines.join('\n');
}
