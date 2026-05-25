/**
 * @noema/config — Preset Tailwind con los tokens NOEMA.
 *
 * Cualquier app web (Next.js) extiende este preset:
 *
 *   // tailwind.config.ts
 *   import noemaPreset from '@noema/config/tailwind-preset';
 *   export default { presets: [noemaPreset], content: [...] };
 *
 * Los tokens también están exportados como TS en `@noema/ui/tokens` para
 * usarse en React Native (donde Tailwind no aplica nativo).
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Paleta principal NOEMA
        'noema-deep': '#2E3B2E',
        'noema-sage': '#3D4D3E',
        paper: '#F1ECE0',
        bone: '#FAF7F1',
        ink: '#2A3328',

        // Acentos emocionales (uso restringido — iconos, bordes, indicadores)
        emotion: {
          tranquilo: '#C7D2BD',
          ansioso: '#F0C9AE',
          triste: '#E8B5AB',
          cansado: '#D9B98C',
          feliz: '#B9C9CC',
        },

        // Alias semánticos para construir UI
        background: {
          DEFAULT: '#F1ECE0', // paper
          card: '#FAF7F1', // bone
          dark: '#2E3B2E', // noema-deep
        },
        foreground: {
          DEFAULT: '#2A3328', // ink
          muted: '#5C6B5A',
          inverse: '#FAF7F1',
        },
        brand: {
          DEFAULT: '#3D4D3E', // noema-sage
          deep: '#2E3B2E',
          soft: '#5C6B5A',
        },
      },

      fontFamily: {
        // Display / serif editorial — para wordmark, titulares, citas
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        // UI / sans — para body y componentes
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        // Escala NOEMA (mobile y desktop comparten la misma jerarquía)
        'display-1': ['6rem', { lineHeight: '1.0', letterSpacing: '-0.02em' }], // 96px
        'h1': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }], // 48px
        'h2': ['2.25rem', { lineHeight: '1.2' }], // 36px
        'h3': ['1.5rem', { lineHeight: '1.25' }], // 24px
        'body-l': ['1.25rem', { lineHeight: '1.5' }], // 20px
        'body-m': ['1rem', { lineHeight: '1.55' }], // 16px
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em' }], // 12px
        'quote': ['1.75rem', { lineHeight: '1.3' }], // 28px
      },

      borderRadius: {
        // Esquinas suaves, propias del lenguaje botánico/orgánico de NOEMA
        sm: '0.375rem', // 6px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.5rem', // 24px
        '2xl': '2rem', // 32px
        pill: '999px',
      },

      spacing: {
        // Espaciado generoso por defecto
        '4.5': '1.125rem', // 18px
        '13': '3.25rem', // 52px
        '15': '3.75rem', // 60px
        '18': '4.5rem', // 72px
      },

      boxShadow: {
        // Sombras casi imperceptibles — el sistema vive plano
        'soft-sm': '0 1px 2px 0 rgba(46, 59, 46, 0.04)',
        'soft': '0 2px 8px -2px rgba(46, 59, 46, 0.06)',
        'soft-lg': '0 8px 24px -8px rgba(46, 59, 46, 0.10)',
      },
    },
  },
  plugins: [],
};
