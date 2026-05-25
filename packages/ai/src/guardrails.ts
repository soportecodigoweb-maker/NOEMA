/**
 * @noema/ai — GUARDRAILS ÉTICOS
 *
 * Esta es la primera línea de defensa del principio fundacional de NOEMA:
 *
 *   "La IA no reemplaza al terapeuta. Organiza, resume y facilita.
 *    El profesional interpreta, decide y conduce."
 *
 * Estos guardrails se aplican EN CÓDIGO, no solo en el prompt.
 * Cualquier llamada a un modelo pasa por:
 *   1. validateInput()  — antes de enviar
 *   2. validateOutput() — antes de devolver al usuario
 *
 * Si una validación falla, NO se llama al modelo (o se descarta la respuesta)
 * y se devuelve un mensaje de "esta información no la puedo generar".
 *
 * Lee BIBLIA NOEMA §10 antes de modificar esto.
 */

// =============================================================================
// PATTERNS PROHIBIDOS — entrada del usuario
// =============================================================================

/**
 * Patrones que indican que el usuario está pidiendo diagnóstico / interpretación
 * clínica / tratamiento. Cuando coincide, devolvemos respuesta canónica sin
 * llamar al modelo.
 */
const FORBIDDEN_INPUT_PATTERNS: ReadonlyArray<RegExp> = [
  // Diagnóstico
  /\b(diagn[oó]stic[ao]|qu[eé]\s+trastorno\s+tiene|es\s+bipolar|tiene\s+(depresi[oó]n|ansiedad|tdah|toc|tept))\b/i,

  // Tratamiento / medicación
  /\b(qu[eé]\s+(medicamento|f[aá]rmaco)|recet[aá]r|dosis|antidepresivo|ansiol[ií]tico)\b/i,

  // Pedirle a la IA que actúe como terapeuta
  /\b(act[uú]a\s+como\s+(terapeuta|psic[oó]log[ao])|s[eé]\s+mi\s+(terapeuta|psic[oó]log[ao]))\b/i,

  // Pedir decisión clínica
  /\b(qu[eé]\s+(le\s+)?(digo|recomiend[oa]|sugier[oa])\s+al\s+paciente|decisi[oó]n\s+cl[ií]nica)\b/i,
];

// =============================================================================
// PATTERNS PROHIBIDOS — salida del modelo
// =============================================================================

/**
 * Si la salida del modelo contiene estos patrones, se descarta y devuelve
 * la respuesta canónica. Doble red de seguridad.
 */
const FORBIDDEN_OUTPUT_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(presenta\s+un\s+cuadro\s+de|es\s+un\s+caso\s+de|sufre\s+de\s+(depresi[oó]n|ansiedad|trastorno))\b/i,
  /\b(le\s+recomiendo\s+que\s+tome|debe\s+empezar\s+a\s+tomar|necesita\s+(medicaci[oó]n|antidepresivos))\b/i,
  /\b(yo\s+puedo\s+ayudarte\s+en\s+esta\s+crisis|cu[eé]ntame\s+qu[eé]\s+sientes,?\s+yo\s+te\s+ayudo\s+a\s+procesarlo)\b/i,
  /\b(mi\s+diagn[oó]stico\s+es|el\s+diagn[oó]stico\s+ser[ií]a)\b/i,
];

// =============================================================================
// PATTERNS DE CRISIS — entrada del usuario
// =============================================================================

/**
 * Si la entrada del paciente contiene estos patrones, NO se procesa por IA.
 * Se activa el flujo del módulo de crisis (BIBLIA §11) y se devuelve la
 * respuesta canónica del módulo de emergencia.
 */
const CRISIS_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(suicid[ai]|me\s+quiero\s+matar|quiero\s+morir(me)?|terminar\s+con\s+mi\s+vida)\b/i,
  /\b(autolesi[oó]n|cortarme|hacerme\s+da[nñ]o|lastimarme)\b/i,
  /\b(no\s+quiero\s+vivir|prefiero\s+no\s+existir|sin\s+sentido\s+seguir)\b/i,
  /\b(hacerle\s+da[nñ]o\s+a\s+alguien|matar\s+a\s+alguien|violencia\s+contra)\b/i,
];

// =============================================================================
// RESPUESTAS CANÓNICAS
// =============================================================================

export const CANONICAL_RESPONSES = {
  forbidden:
    'Esta información no la puedo generar. NOEMA no diagnostica, no interpreta clínicamente y no sustituye decisiones profesionales. Si necesitas orientación, consulta con tu terapeuta.',
  crisisDetected:
    'Si estás en una crisis o sientes que puedes hacerte daño o hacerle daño a alguien, busca ayuda inmediata: llama a servicios de emergencia o contacta a una persona de confianza ahora. NOEMA no sustituye servicios de emergencia ni atención profesional urgente.',
  aiDisclaimer:
    'Esta es información operativa generada automáticamente. No constituye diagnóstico, tratamiento ni interpretación clínica. Cualquier decisión profesional corresponde a tu terapeuta.',
} as const;

// =============================================================================
// VALIDADORES
// =============================================================================

export type GuardrailResult =
  | { ok: true }
  | { ok: false; reason: 'forbidden' | 'crisis'; canonicalResponse: string };

/**
 * Valida la entrada del usuario antes de mandarla al modelo.
 * Devuelve { ok: true } si pasa, o el motivo y la respuesta canónica si no.
 */
export function validateInput(input: string): GuardrailResult {
  // 1. Detectar crisis primero (prioridad máxima)
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(input)) {
      return {
        ok: false,
        reason: 'crisis',
        canonicalResponse: CANONICAL_RESPONSES.crisisDetected,
      };
    }
  }

  // 2. Detectar pedido de diagnóstico / tratamiento
  for (const pattern of FORBIDDEN_INPUT_PATTERNS) {
    if (pattern.test(input)) {
      return {
        ok: false,
        reason: 'forbidden',
        canonicalResponse: CANONICAL_RESPONSES.forbidden,
      };
    }
  }

  return { ok: true };
}

/**
 * Valida la salida del modelo antes de devolverla al usuario.
 * Si contiene patrones prohibidos, se descarta.
 */
export function validateOutput(output: string): GuardrailResult {
  for (const pattern of FORBIDDEN_OUTPUT_PATTERNS) {
    if (pattern.test(output)) {
      return {
        ok: false,
        reason: 'forbidden',
        canonicalResponse: CANONICAL_RESPONSES.forbidden,
      };
    }
  }
  return { ok: true };
}

/**
 * Envuelve cualquier salida de IA con el disclaimer obligatorio.
 * Usar SIEMPRE antes de mostrar al usuario.
 */
export function withDisclaimer(content: string): string {
  return `${content}\n\n---\n_${CANONICAL_RESPONSES.aiDisclaimer}_`;
}
