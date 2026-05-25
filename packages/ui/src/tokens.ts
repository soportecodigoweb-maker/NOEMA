/**
 * NOEMA — Design Tokens
 *
 * Fuente única de verdad para color, tipografía, espaciado y radios.
 * Usados por:
 *   - Tailwind (web) vía `@noema/config/tailwind-preset`
 *   - React Native (mobile) consumiendo directamente estos valores
 *
 * NO modificar sin actualizar la BIBLIA NOEMA (sección 8).
 */

// =============================================================================
// COLOR — Paleta principal "sage + papel"
// =============================================================================

export const colors = {
  // Marca
  noemaDeep: '#2E3B2E', // Fondo oscuro principal
  noemaSage: '#3D4D3E', // Color de marca
  paper: '#F1ECE0', // Fondo claro principal
  bone: '#FAF7F1', // Superficies de cards
  ink: '#2A3328', // Texto y titulares
} as const;

/**
 * Acentos emocionales.
 * Uso restringido: SOLO iconos, bordes suaves e indicadores pequeños.
 * NUNCA como fondo extenso de pantalla.
 */
export const emotionColors = {
  tranquilo: '#C7D2BD', // Calma, gratitud, descanso, equilibrio
  ansioso: '#F0C9AE', // Ansiedad, preocupación, alerta, anticipación
  triste: '#E8B5AB', // Tristeza, duelo, melancolía, soledad
  cansado: '#D9B98C', // Fatiga, agotamiento, sueño, sobrecarga
  feliz: '#B9C9CC', // Alegría, satisfacción, entusiasmo, conexión
} as const;

export type EmotionKey = keyof typeof emotionColors;

/**
 * Alias semánticos — usar estos preferentemente en componentes.
 */
export const semanticColors = {
  background: {
    default: colors.paper,
    card: colors.bone,
    dark: colors.noemaDeep,
  },
  foreground: {
    default: colors.ink,
    muted: '#5C6B5A',
    inverse: colors.bone,
  },
  brand: {
    default: colors.noemaSage,
    deep: colors.noemaDeep,
    soft: '#5C6B5A',
  },
  border: {
    soft: 'rgba(46, 59, 46, 0.08)',
    default: 'rgba(46, 59, 46, 0.16)',
    strong: 'rgba(46, 59, 46, 0.24)',
  },
} as const;

/**
 * Distribución recomendada de color:
 *   60% Paper · 25% Bone · 12% Sage · 3% acentos
 */
export const colorDistribution = {
  paper: 60,
  bone: 25,
  sage: 12,
  accents: 3,
} as const;

// =============================================================================
// TIPOGRAFÍA
// =============================================================================

export const fonts = {
  serif: '"Cormorant Garamond", Georgia, serif', // Display, wordmark, titulares, citas
  sans: '"DM Sans", system-ui, -apple-system, sans-serif', // UI, body
} as const;

export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Escala tipográfica NOEMA.
 * Tamaños en px, listos para usar tanto en web como en RN (multiplicar por 1 o
 * adaptar a `Text` styles).
 */
export const typography = {
  displayD1: { family: 'serif', size: 96, lineHeight: 96, weight: 400 },
  h1: { family: 'serif', size: 48, lineHeight: 53, weight: 500 },
  h2: { family: 'serif', size: 36, lineHeight: 43, weight: 500 },
  h3: { family: 'sans', size: 24, lineHeight: 30, weight: 600 },
  bodyL: { family: 'sans', size: 20, lineHeight: 30, weight: 400 },
  bodyM: { family: 'sans', size: 16, lineHeight: 25, weight: 400 },
  caption: { family: 'sans', size: 12, lineHeight: 17, weight: 500, letterSpacing: 1 },
  quote: { family: 'serif', size: 28, lineHeight: 36, weight: 300, italic: true },
} as const;

export type TypographyKey = keyof typeof typography;

// =============================================================================
// ESPACIADO
// =============================================================================

/**
 * Escala basada en 4px. NOEMA respira: prefiere espacios generosos.
 */
export const spacing = {
  px: 1,
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

// =============================================================================
// RADIOS — esquinas suaves, lenguaje orgánico
// =============================================================================

export const radii = {
  none: 0,
  sm: 6,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  pill: 999,
} as const;

// =============================================================================
// SOMBRAS — casi imperceptibles. El sistema vive plano.
// =============================================================================

export const shadows = {
  none: 'none',
  softSm: '0 1px 2px 0 rgba(46, 59, 46, 0.04)',
  soft: '0 2px 8px -2px rgba(46, 59, 46, 0.06)',
  softLg: '0 8px 24px -8px rgba(46, 59, 46, 0.10)',
} as const;

// =============================================================================
// DURACIÓN Y EASING — ritmo lento, sereno
// =============================================================================

export const motion = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 240,
    slow: 360,
    slower: 600,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const;

// =============================================================================
// EXPORT AGRUPADO
// =============================================================================

export const tokens = {
  colors,
  emotionColors,
  semanticColors,
  colorDistribution,
  fonts,
  fontWeights,
  typography,
  spacing,
  radii,
  shadows,
  motion,
} as const;

export type Tokens = typeof tokens;
export default tokens;
