import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: {
    default: 'NOEMA · Panel terapeuta',
    template: '%s · NOEMA',
  },
  description:
    'Da seguimiento real a tus pacientes entre sesiones. Organiza, registra y prepara mejor cada consulta.',
  applicationName: 'NOEMA',
  authors: [{ name: 'NOEMA' }],
  robots: {
    // El panel del terapeuta no debe indexarse;
    // las páginas públicas (landing, directorio) sobreescriben esto.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#F1ECE0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-MX"
      className={`${cormorant.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
