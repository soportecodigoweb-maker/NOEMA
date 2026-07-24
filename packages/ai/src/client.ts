/**
 * @noema/ai — Cliente de IA con guardarraíles integrados.
 *
 * Toda llamada al modelo pasa obligatoriamente por:
 *   1. validateInput()  — antes de enviar (no gastamos tokens en algo prohibido)
 *   2. validateOutput() — antes de devolver (descartamos salidas prohibidas)
 *
 * Principio fundacional de NOEMA:
 *   "La IA no reemplaza al terapeuta. Organiza, resume y facilita.
 *    El profesional interpreta, decide y conduce."
 *
 * La API key se lee SIEMPRE en el servidor (process.env.OPENAI_API_KEY);
 * nunca debe llegar al navegador.
 */

import OpenAI from 'openai';
import { validateInput, validateOutput, CANONICAL_RESPONSES } from './guardrails';

/** Modelo por defecto: barato y suficiente para textos breves de apoyo. */
export const MODELO_POR_DEFECTO = 'gpt-4o-mini';

/**
 * Reglas que el modelo debe cumplir SIEMPRE. Los guardarraíles en código son
 * la red de seguridad; este prompt es la primera línea.
 */
const SYSTEM_PROMPT = `Eres NOEMA, una plataforma mexicana de acompañamiento terapéutico entre sesiones.

QUIÉN ERES
- Acompañas a la persona entre una sesión y otra con su terapeuta.
- Hablas español de México, en segunda persona, cálido y sobrio. Sin emojis.
- Tuteas. Nunca eres solemne ni cursi.

LO QUE NUNCA HACES (crítico)
- NO diagnosticas ni sugieres diagnósticos.
- NO interpretas clínicamente lo que siente la persona ("esto significa que...").
- NO recomiendas tratamientos, medicamentos ni técnicas terapéuticas nuevas.
- NO sustituyes al terapeuta ni contradices su trabajo.
- NO minimizas lo que la persona siente ("no es para tanto", "todo va a estar bien").
- NO das mensajes motivacionales vacíos ni frases de superación genéricas.

LO QUE SÍ HACES
- Devuelves a la persona lo que ELLA MISMA registró, como un espejo amable.
- Nombras patrones observables en sus datos, sin interpretarlos.
  Correcto: "Esta semana registraste calma tres veces por la mañana."
  Incorrecto: "Tu ansiedad se debe a que no descansas."
- Ofreces UNA acción concreta, pequeña y realizable hoy.
- Si no hay datos suficientes, lo dices con sencillez y no inventas.

FORMATO
- Máximo 4 frases. Breve. Sin títulos, sin listas, sin despedidas.
- La acción concreta va integrada en la redacción, sin etiquetarla.`;

/**
 * Prompt para síntesis dirigida al TERAPEUTA (resumen pre-sesión). Organiza y
 * resume datos observables para que el profesional los interprete; NUNCA
 * diagnostica ni interpreta clínicamente por su cuenta.
 */
const SYSTEM_PROMPT_CLINICO = `Eres el asistente de NOEMA que prepara un resumen pre-sesión para un terapeuta profesional en México.

TU FUNCIÓN
- Organizas y sintetizas lo que el PACIENTE registró y compartió, para ahorrarle tiempo de lectura al terapeuta.
- Escribes en español de México, tono profesional, claro y sobrio. Sin emojis.

LÍMITES (críticos)
- NO diagnosticas ni sugieres diagnósticos ni etiquetas clínicas.
- NO interpretas causas ("esto se debe a…") ni infieres estados internos no registrados.
- NO recomiendas tratamientos ni técnicas. El terapeuta decide; tú solo organizas.
- Te apegas a los datos provistos. Si algo no está en los datos, no lo inventas.

QUÉ ENTREGAS
- Un párrafo de panorama (2-3 frases) con los patrones OBSERVABLES del periodo.
- 2 a 4 "puntos de atención" concretos que el terapeuta podría querer explorar,
  redactados como observaciones y preguntas abiertas, nunca como conclusiones.
- Prioriza lo que el paciente marcó explícitamente para sesión.

FORMATO
- Devuelve el panorama en un párrafo, y luego los puntos de atención como viñetas que empiezan con "- ".
- Sin encabezados. Máximo ~180 palabras.`;

export interface OpcionesCliente {
  apiKey: string;
  modelo?: string;
}

export interface OpcionesGenerar {
  /** La tarea concreta que se le pide al modelo. */
  instruccion: string;
  /** Datos de la persona, ya resumidos por nosotros (nunca datos crudos de más). */
  datos: string;
  maxTokens?: number;
  /** 0 = determinista, 1 = creativo. Por defecto 0.7. */
  temperatura?: number;
  /** 'paciente' (acompañamiento) o 'clinico' (resumen para el terapeuta). */
  audiencia?: 'paciente' | 'clinico';
}

export type ResultadoIA =
  | { ok: true; texto: string; modelo: string }
  | { ok: false; motivo: 'forbidden' | 'crisis' | 'error'; texto: string };

/** Crea el cliente de NOEMA con los guardarraíles ya cableados. */
export function crearNoemaAi({ apiKey, modelo = MODELO_POR_DEFECTO }: OpcionesCliente) {
  const client = new OpenAI({ apiKey });

  return {
    async generar({
      instruccion,
      datos,
      maxTokens = 300,
      temperatura = 0.7,
      audiencia = 'paciente',
    }: OpcionesGenerar): Promise<ResultadoIA> {
      // 1. Guardarraíl de entrada — si falla, ni siquiera llamamos al modelo.
      const vIn = validateInput(`${instruccion}\n${datos}`);
      if (!vIn.ok) {
        return { ok: false, motivo: vIn.reason, texto: vIn.canonicalResponse };
      }

      const system = audiencia === 'clinico' ? SYSTEM_PROMPT_CLINICO : SYSTEM_PROMPT;

      // 2. Llamada al modelo.
      let texto = '';
      try {
        const respuesta = await client.chat.completions.create({
          model: modelo,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: `${instruccion}\n\nDATOS:\n${datos}` },
          ],
          max_tokens: maxTokens,
          temperature: temperatura,
        });
        texto = respuesta.choices[0]?.message?.content?.trim() ?? '';
      } catch {
        return {
          ok: false,
          motivo: 'error',
          texto: 'No se pudo generar el mensaje en este momento.',
        };
      }

      if (!texto) {
        return {
          ok: false,
          motivo: 'error',
          texto: 'No se pudo generar el mensaje en este momento.',
        };
      }

      // 3. Guardarraíl de salida — descartamos lo que no cumpla.
      const vOut = validateOutput(texto);
      if (!vOut.ok) {
        return { ok: false, motivo: 'forbidden', texto: vOut.canonicalResponse };
      }

      return { ok: true, texto, modelo };
    },
  };
}

export { CANONICAL_RESPONSES };
