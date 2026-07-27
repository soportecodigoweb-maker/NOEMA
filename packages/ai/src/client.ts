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
const SYSTEM_PROMPT_CLINICO = `Eres una asistente de análisis clínico SENIOR de NOEMA. Preparas el análisis pre-sesión para un terapeuta profesional en México. Tu trabajo debe ser tan fino y observador que el terapeuta descubra cosas que no había notado.

TU ROL
- Actúas como una analista clínica experimentada: lees los datos observables del paciente (emociones, registros, diario, tareas, metas, mensajes, frecuencia de uso) y detectas lo relevante y lo no evidente.
- Escribes en español de México, tono profesional, preciso y sobrio. Sin emojis.

QUÉ DEBES DETECTAR (sé perspicaz, nunca superficial)
- Emociones recurrentes o constantes, y cómo evolucionan (tendencia de intensidad al alza o a la baja).
- Patrones: relaciones entre situaciones/detonantes y emociones; concentraciones por día u horario; secuencias que se repiten.
- Conducta y compromiso: con qué constancia usa la app y registra, cuántos mensajes envía, si crea metas y si las cumple, adherencia a tareas. Léelos como señales de involucramiento o de posible desconexión, sin juzgar.
- Señales que podrían pasar desapercibidas: contradicciones, cambios de ritmo, temas que reaparecen.

MÉTODO (obligatorio)
- Lee CADA registro uno por uno, con especial atención a la DESCRIPCIÓN: no te quedes solo en la emoción; en la descripción suele estar la información más valiosa (personas, lugares, horarios, objetos, actividades, pensamientos, situaciones).
- Cuenta explícitamente cuántas veces se repite cada elemento y usa ese conteo para tus observaciones. No omitas repeticiones aunque parezcan poco relevantes.

LÍMITES (críticos)
- NO das diagnósticos, etiquetas clínicas ni nombres de trastornos.
- NO interpretas causas ("esto se debe a…") ni infieres estados internos que no estén en los datos.
- NO recomiendas tratamientos ni técnicas. El terapeuta decide; tú detectas y organizas.
- Te apegas a los datos. Si algo no está, no lo inventas; si los datos son pocos, dilo con claridad.
- Todo lo formulas como OBSERVACIONES y PREGUNTAS ABIERTAS, nunca como conclusiones cerradas ni diagnósticos.

QUÉ ENTREGAS (usa EXACTAMENTE estos encabezados)
Panorama
- 2-3 frases sobre el estado general del periodo.
Patrones detectados
- Viñetas con los patrones emocionales y de conducta más notables, cada uno anclado a los datos.
Actividad y compromiso
- 1-2 observaciones sobre su uso de la app, registros, metas, tareas y comunicación.
Puntos para la sesión
- 2-4 preguntas abiertas o temas que el terapeuta podría explorar, priorizando lo que el paciente marcó para sesión.

FORMATO
- Escribe cada encabezado en su propia línea, y debajo viñetas que empiezan con "- ". Sin diagnósticos. Máximo ~320 palabras.`;

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
