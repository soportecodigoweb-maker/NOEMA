/**
 * Tema NOEMA adaptado a React Native.
 *
 * Re-exporta los tokens desde @noema/ui y arma un `theme` práctico para usar
 * en StyleSheet.create() y componentes.
 *
 * Las fuentes están registradas en app/_layout.tsx con useFonts() — los
 * nombres aquí deben coincidir con los nombres registrados.
 */
import { tokens } from '@noema/ui';

export const colors = tokens.colors;
export const emotionColors = tokens.emotionColors;
export const semanticColors = tokens.semanticColors;
export const spacing = tokens.spacing;
export const radii = tokens.radii;
export const shadows = tokens.shadows;

// Nombres de fuente como están registrados en useFonts() — clave para RN
export const fontFamily = {
  serifLight: 'CormorantGaramond-Light',
  serifRegular: 'CormorantGaramond-Regular',
  serifMedium: 'CormorantGaramond-Medium',
  serifSemiBold: 'CormorantGaramond-SemiBold',
  serifLightItalic: 'CormorantGaramond-LightItalic',
  sansLight: 'DMSans-Light',
  sansRegular: 'DMSans-Regular',
  sansMedium: 'DMSans-Medium',
  sansSemiBold: 'DMSans-SemiBold',
  sansBold: 'DMSans-Bold',
} as const;

/**
 * Variantes de texto NOEMA listas para usar:
 *   <Text variant="h1">...
 */
export const textVariants = {
  displayD1: {
    fontFamily: fontFamily.serifRegular,
    fontSize: 96,
    lineHeight: 96,
    color: colors.ink,
    letterSpacing: -1.5,
  },
  h1: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 40, // un poco menor en mobile que en desktop
    lineHeight: 46,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  h3: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  },
  bodyL: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
  },
  bodyM: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
  },
  caption: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 15,
    color: '#5C6B5A',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  quote: {
    fontFamily: fontFamily.serifLightItalic,
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
  },
  muted: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: '#5C6B5A',
  },
} as const;

export type TextVariant = keyof typeof textVariants;

/**
 * Tema agrupado para pasar a navegación o context si hiciera falta.
 */
export const theme = {
  colors,
  emotionColors,
  semanticColors,
  spacing,
  radii,
  shadows,
  fontFamily,
  textVariants,
} as const;

export type Theme = typeof theme;
