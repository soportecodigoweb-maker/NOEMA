import type { Config } from 'tailwindcss';
import noemaPreset from '@noema/config/tailwind-preset';

export default {
  presets: [noemaPreset],
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './src/**/*.{ts,tsx,mdx}',
    // Permite que componentes del paquete @noema/ui (cuando los tengamos web)
    // hereden las clases purgeables
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // next/font inyecta variables; sobreescribimos los defaults del preset
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config;
