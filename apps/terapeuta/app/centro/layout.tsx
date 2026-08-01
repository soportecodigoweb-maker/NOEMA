import { redirect } from 'next/navigation';
import { Building2, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Vesica } from '@/components/ui/Vesica';
import { AutoLogout } from '@/components/cuenta/AutoLogout';
import { signOutAction } from '../(auth)/actions';

export default async function CentroLayout({ children }: { children: React.ReactNode }) {
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

  if (profile.rol !== 'centro') {
    redirect(profile.rol === 'terapeuta' || profile.rol === 'admin' ? '/inicio' : '/paciente');
  }

  const { data: centro } = await supabase
    .from('centros')
    .select('nombre_centro')
    .eq('profile_id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-noema-deep/[0.08] bg-noema-deep text-bone">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Vesica size={26} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
            <div>
              <span className="block font-serif text-lg tracking-[0.28em]">NOEMA</span>
              <span className="flex items-center gap-1 text-xs text-bone/60">
                <Building2 className="size-3" /> {centro?.nombre_centro ?? 'Centro terapéutico'}
              </span>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-bone/70 transition-colors hover:bg-bone/[0.06] hover:text-bone"
            >
              <LogOut className="size-4" strokeWidth={1.7} /> Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <AutoLogout habilitado={profile.auto_logout_habilitado} />
    </div>
  );
}
