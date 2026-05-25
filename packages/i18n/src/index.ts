import { esMX } from './es-MX';

export { esMX };
export type { Locale } from './es-MX';

/**
 * Locales disponibles. Por ahora solo es-MX (mercado primario).
 * Preparado para agregar es-ES, es-CO, en-US sin reescribir.
 */
export const locales = {
  'es-MX': esMX,
} as const;

export type LocaleKey = keyof typeof locales;

export const defaultLocale: LocaleKey = 'es-MX';

/**
 * Helper minimalista para reemplazar `{placeholders}` en strings.
 *
 * @example
 *   t(esMX.terapeuta.greeting, { name: 'Andrea' }) → "Hola, Andrea"
 */
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
