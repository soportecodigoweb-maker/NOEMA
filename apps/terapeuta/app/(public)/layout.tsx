import Link from 'next/link';
import type { Metadata } from 'next';
import { Vesica } from '@/components/ui/Vesica';
import { createClient } from '@/lib/supabase/server';

// Las rutas dentro de (public) SÍ se indexan en buscadores
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header público */}
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-noema-deep/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-noema-deep">
            <Vesica size={26} color="currentColor" strokeWidth={1.5} />
            <span className="font-serif text-lg tracking-[0.34em]">NOEMA</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/terapeutas" className="text-foreground-muted hover:text-ink">
              Encuentra terapeuta
            </Link>
            {user ? (
              <Link
                href="/inicio"
                className="px-4 py-2 rounded-md bg-noema-sage text-bone hover:bg-noema-deep transition-colors"
              >
                Mi panel
              </Link>
            ) : (
              <>
                <Link href="/signin" className="text-foreground-muted hover:text-ink">
                  Iniciar sesión
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-md bg-noema-sage text-bone hover:bg-noema-deep transition-colors"
                >
                  Soy terapeuta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-noema-deep/[0.06] mt-16">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-foreground-muted">
            <Vesica size={18} color="currentColor" strokeWidth={1.5} />
            <span className="font-serif text-sm tracking-[0.34em]">NOEMA</span>
            <span className="text-xs">© 2026</span>
          </div>
          <nav className="flex gap-6 text-xs text-foreground-muted">
            <Link href="/terminos" className="hover:text-ink">Términos</Link>
            <Link href="/privacidad" className="hover:text-ink">Privacidad</Link>
            <a href="mailto:hola@noema.app" className="hover:text-ink">Contacto</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
