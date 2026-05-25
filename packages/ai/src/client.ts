/**
 * @noema/ai — Cliente Claude con prompt caching y guardrails integrados.
 *
 * Uso típico (en una Edge Function de Supabase):
 *
 *   const ai = createNoemaAi({ apiKey: env.ANTHROPIC_API_KEY });
 *   const result = await ai.generateOperational({
 *     userPrompt: 'Resume la actividad del paciente esta semana',
 *     contextData: '...',
 *   });
 *
 * Lee BIBLIA NOEMA §10 antes de modificar este archivo.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  validateInput,
  validateOutput,
  withDisclaimer,
  CANONICAL_RESPONSES,
  type GuardrailResult,
} from './guardrails';

// El system prompt se importa como string en tiempo de build.
// En runtime se lee desde aquí — esto permite que Anthropic lo cachee.
import systemPromptRaw from './prompts/system.md' assert { type: 'text' };

export type Audience = 'terapeuta' | 'paciente';

export interface GenerateOptions {
  /** Mensaje del usuario / petición */
  userPrompt: string;
  /** Datos estructurados (registros, tareas, etc) que la IA va a resumir */
  contextData?: string;
  /** Quién está leyendo la respuesta — afecta el tono */
  audience: Audience;
  /** Modelo a usar. Default: claude-sonnet-4-5 (balance costo/calidad) */
  model?: string;
  /** Max tokens en la respuesta */
  maxTokens?: number;
}

export interface GenerateResult {
  ok: boolean;
  content: string;
  /** Si false, el resultado es la canonical response — NO viene del modelo */
  fromModel: boolean;
  /** Si se bloqueó por guardrails, este campo dice por qué */
  blocked?: GuardrailResult extends { ok: false } ? { reason: string } : undefined;
  /** Telemetría útil */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
  };
}

export interface CreateAiOptions {
  apiKey: string;
  defaultModel?: string;
}

export function createNoemaAi({ apiKey, defaultModel = 'claude-sonnet-4-5' }: CreateAiOptions) {
  const client = new Anthropic({ apiKey });

  return {
    /**
     * Genera contenido operativo (resúmenes, agrupaciones, listas).
     * NUNCA se debe usar para conversación libre con el paciente.
     */
    async generateOperational(opts: GenerateOptions): Promise<GenerateResult> {
      // 1. Validar input ANTES de llamar al modelo
      const inputCheck = validateInput(opts.userPrompt);
      if (!inputCheck.ok) {
        return {
          ok: false,
          content: inputCheck.canonicalResponse,
          fromModel: false,
          blocked: { reason: inputCheck.reason } as never,
        };
      }

      // 2. Construir el mensaje con cache control en el system prompt
      const systemBlocks: Anthropic.MessageParam['content'] = [];
      // El system prompt va con cache_control para amortizar costo
      // (lo cachea por 5 min, perfecto para apps con múltiples requests)

      try {
        const response = await client.messages.create({
          model: opts.model ?? defaultModel,
          max_tokens: opts.maxTokens ?? 1024,
          system: [
            {
              type: 'text',
              text: systemPromptRaw,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [
            {
              role: 'user',
              content: buildUserMessage(opts),
            },
          ],
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        const rawOutput = textBlock?.type === 'text' ? textBlock.text : '';

        // 3. Validar output del modelo
        const outputCheck = validateOutput(rawOutput);
        if (!outputCheck.ok) {
          return {
            ok: false,
            content: outputCheck.canonicalResponse,
            fromModel: false,
            blocked: { reason: outputCheck.reason } as never,
          };
        }

        // 4. Envolver con disclaimer obligatorio
        return {
          ok: true,
          content: withDisclaimer(rawOutput),
          fromModel: true,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
            cacheCreationTokens: response.usage.cache_creation_input_tokens ?? undefined,
          },
        };
      } catch (error) {
        // Si el modelo falla, devolvemos un mensaje genérico
        return {
          ok: false,
          content:
            'No pudimos generar este resumen en este momento. Inténtalo de nuevo en unos minutos.',
          fromModel: false,
        };
      }
    },

    /** Para tests: expone las constantes para verificar comportamiento */
    _internals: {
      CANONICAL_RESPONSES,
    },
  };
}

function buildUserMessage(opts: GenerateOptions): string {
  const parts: string[] = [];

  parts.push(`# Audiencia\n${opts.audience === 'terapeuta' ? 'Un terapeuta profesional.' : 'Una persona en proceso terapéutico.'}`);

  if (opts.contextData) {
    parts.push(`# Datos\n\n${opts.contextData}`);
  }

  parts.push(`# Tarea\n${opts.userPrompt}`);

  return parts.join('\n\n');
}
