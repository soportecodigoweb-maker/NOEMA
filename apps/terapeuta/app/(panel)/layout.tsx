import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/nav/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Profile + terapeuta (para mostrar en sidebar)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nombre, avatar_url, rol, onboarding_completo')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/signin');
  }

  if (profile.rol !== 'terapeuta') {
    // Si por error un paciente o sin_terapeuta llega aquí, vamos a un fallback.
    // (Eventualmente: pantalla "Esta cuenta no es de terapeuta.")
    redirect('/signin');
  }

  if (!profile.onboarding_completo) {
    redirect('/perfil');
  }

  const { data: terapeuta } = await supabase
    .from('terapeutas')
    .select('titulo')
    .eq('profile_id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={{
          nombre: profile.nombre,
          avatarUrl: profile.avatar_url,
          titulo: terapeuta?.titulo ?? 'Terapeuta',
        }}
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
