/**
 * NOEMA — Theme helpers.
 *
 * Funciones puras para componer estilos consistentes a partir de los tokens.
 * Importable desde web y mobile.
 */

import { tokens, type EmotionKey, type TypographyKey } from './tokens';

/**
 * Devuelve el color asociado a una emoción.
 * Usado en iconos, bordes e indicadores — NO como fondo extenso.
 */
export function getEmotionColor(emotion: EmotionKey): string {
  return tokens.emotionColors[emotion];
}

/**
 * Devuelve un objeto de estilos tipográficos listo para React Native o web.
 */
export function getTypography(key: TypographyKey) {
  const t = tokens.typography[key];
  return {
    fontFamily: tokens.fonts[t.family as 'serif' | 'sans'],
    fontSize: t.size,
    lineHeight: t.lineHeight,
    fontWeight: t.weight,
    ...('letterSpacing' in t ? { letterSpacing: t.letterSpacing } : {}),
    ...('italic' in t && t.italic ? { fontStyle: 'italic' as const } : {}),
  };
}

/**
 * Devuelve un espaciado del sistema. Equivalente a tokens.spacing[key].
 */
export function space(key: keyof typeof tokens.spacing): number {
  return tokens.spacing[key];
}

/**
 * Catálogo legible de emociones — para UI de selección.
 */
export const emotionsCatalog: ReadonlyArray<{
  key: EmotionKey;
  label: string;
  description: string;
  color: string;
}> = [
  {
    key: 'tranquilo',
    label: 'Tranquilo',
    description: 'Calma, gratitud, descanso, equilibrio.',
    color: tokens.emotionColors.tranquilo,
  },
  {
    key: 'ansioso',
    label: 'Ansioso',
    description: 'Ansiedad, preocupación, alerta, anticipación.',
    color: tokens.emotionColors.ansioso,
  },
  {
    key: 'triste',
    label: 'Triste',
    description: 'Tristeza, duelo, melancolía, soledad.',
    color: tokens.emotionColors.triste,
  },
  {
    key: 'cansado',
    label: 'Cansado',
    description: 'Fatiga, agotamiento, sueño, sobrecarga.',
    color: tokens.emotionColors.cansado,
  },
  {
    key: 'feliz',
    label: 'Feliz',
    description: 'Alegría, satisfacción, entusiasmo, conexión.',
    color: tokens.emotionColors.feliz,
  },
];
