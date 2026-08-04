import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Vesica } from '@/components/ui/Vesica';
import { AutoLogout } from '@/components/cuenta/AutoLogout';
import { signOutAction } from '../(auth)/actions';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta, auto_logout_habilitado')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/signin');

  if (profile.estado_cuenta === 'eliminada') {
    await supabase.auth.signOut();
    redirect('/signin?motivo=cuenta-eliminada');
  }

  // Panel EXCLUSIVO del dueño de NOEMA (rol admin). Aislado del resto.
  if (profile.rol !== 'admin') {
    redirect(
      profile.rol === 'terapeuta'
        ? '/inicio'
        : profile.rol === 'centro'
          ? '/centro'
          : '/paciente',
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-noema-deep text-bone">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Vesica size={26} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
            <div>
              <span className="block font-serif text-lg tracking-[0.28em]">NOEMA</span>
              <span className="flex items-center gap-1 text-xs text-bone/60">
                <ShieldCheck className="size-3" /> Panel de dueño
              </span>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-0.5">
            {[
              { href: '/admin', label: 'Panorama' },
              { href: '/admin/usuarios', label: 'Usuarios' },
              { href: '/admin/solicitudes', label: 'Solicitudes' },
              { href: '/admin/metricas', label: 'Métricas' },
              { href: '/admin/analitica', label: 'Analítica' },
              { href: '/admin/impacto', label: 'Impacto' },
              { href: '/admin/vincular', label: 'Vincular' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm text-bone/70 hover:bg-bone/[0.06] hover:text-bone"
              >
                {l.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-bone/70 transition-colors hover:bg-bone/[0.06] hover:text-bone"
              >
                <LogOut className="size-4" strokeWidth={1.7} /> Salir
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>

      <AutoLogout habilitado={profile.auto_logout_habilitado} />
    </div>
  );
}
