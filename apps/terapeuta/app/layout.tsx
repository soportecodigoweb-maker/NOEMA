import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans, Caveat } from 'next/font/google';
import './globals.css';
import { SonidosUI } from '@/components/sonidos/SonidosUI';
import { RegistrarSW } from '@/components/pwa/RegistrarSW';
import { InstalarPWA } from '@/components/pwa/InstalarPWA';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// Fuente manuscrita para el diario (se siente como escribir a mano).
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manuscrita',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'NOEMA · Panel terapeuta',
    template: '%s · NOEMA',
  },
  description:
    'Da seguimiento real a tus pacientes entre sesiones. Organiza, registra y prepara mejor cada consulta.',
  applicationName: 'NOEMA',
  authors: [{ name: 'NOEMA' }],
  // PWA: íconos e integración con iOS ("Agregar a inicio").
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'NOEMA',
    statusBarStyle: 'default',
  },
  robots: {
    // El panel del terapeuta no debe indexarse;
    // las páginas públicas (landing, directorio) sobreescriben esto.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#F1ECE0',
  // Evita que el "modo oscuro automático" del navegador (Chrome Android)
  // invierta los colores y deje texto claro sobre fondo blanco.
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  // App con tamaño fijo: sin zoom con los dedos.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-MX"
      className={`${cormorant.variable} ${dmSans.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen touch-manipulation bg-paper text-ink antialiased">
        {children}
        {/* Sonidos de interacción (toques, teclas, interruptores) — ambos roles */}
        <SonidosUI />
        {/* PWA: registra el service worker para instalación y modo sin conexión */}
        <RegistrarSW />
        <InstalarPWA />
      </body>
    </html>
  );
}
