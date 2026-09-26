import '@/components/demo/demo.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Demo · NOEMA', template: '%s · Demo NOEMA' },
  robots: { index: true, follow: true },
};

/** Las páginas del demo tienen su propio diseño de pantalla completa. */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
