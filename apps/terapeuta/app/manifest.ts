import type { MetadataRoute } from 'next';

/** Manifiesto PWA: hace la app instalable en Android e iOS. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NOEMA',
    short_name: 'NOEMA',
    description: 'Acompañamiento terapéutico: registra cómo te sientes y sigue tu proceso.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F1ECE0',
    theme_color: '#2E3B2E',
    lang: 'es-MX',
    dir: 'ltr',
    categories: ['health', 'medical', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
