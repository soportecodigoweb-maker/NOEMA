import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AutoLogout } from '@/components/cuenta/AutoLogout';
import { PanelLateral } from '@/components/nav/PanelLateral';

export default async function CentroLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, estado_cuenta, auto_logout_habilitado, nombre')
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

  let { data: centro } = await supabase
    .from('centros')
    .select('nombre_centro')
    .eq('profile_id', user.id)
    .maybeSingle();

  // Auto-reparación: si el onboarding quedó a medias, creamos su ficha para que
  // el panel nunca aparezca vacío ni roto.
  if (!centro) {
    const codigo = `CENTRO-${crypto.randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase()}`;
    await supabase
      .from('centros')
      .upsert(
        { profile_id: user.id, nombre_centro: profile.nombre || 'Mi centro', codigo_centro: codigo },
        { onConflict: 'profile_id' },
      );
    const { data: nuevo } = await supabase
      .from('centros')
      .select('nombre_centro')
      .eq('profile_id', user.id)
      .maybeSingle();
    centro = nuevo;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <PanelLateral
        panel="centro"
        subtitulo={centro?.nombre_centro ?? 'Tu centro'}
        usuario={{ nombre: profile.nombre, sub: 'Encargado del centro' }}
      />
      <main className="min-w-0 flex-1 overflow-x-hidden px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <AutoLogout habilitado={profile.auto_logout_habilitado} />
    </div>
  );
}
