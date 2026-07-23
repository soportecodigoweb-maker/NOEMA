import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/nav/Sidebar';
import { AlertasCrisisEnVivo } from '@/components/crisis/AlertasCrisisEnVivo';
import { RegistrosEnVivo } from '@/components/registros/RegistrosEnVivo';
import { createClient } from '@/lib/supabase/server';
import { VERSION_AVISO } from '@/lib/aviso-confidencialidad';

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

  // Profile, aviso y terapeuta dependen solo de user.id → en paralelo
  // (antes iban en serie: 3 idas y vueltas a la BD encadenadas).
  const [{ data: profile }, { data: aviso }, { data: terapeuta }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nombre, avatar_url, rol, onboarding_completo')
      .eq('id', user.id)
      .single(),
    supabase
      .from('consentimientos')
      .select('id')
      .eq('profile_id', user.id)
      .eq('tipo', 'aviso_privacidad')
      .eq('version', VERSION_AVISO)
      .eq('aceptado', true)
      .limit(1)
      .maybeSingle(),
    supabase.from('terapeutas').select('titulo').eq('profile_id', user.id).maybeSingle(),
  ]);

  if (!profile) {
    redirect('/signin');
  }

  if (profile.rol !== 'terapeuta' && profile.rol !== 'admin') {
    redirect('/paciente');
  }

  if (!profile.onboarding_completo) {
    redirect('/perfil');
  }

  // Aviso de confidencialidad (#12): el terapeuta debe aceptar la versión vigente.
  if (!aviso) {
    redirect('/aviso-confidencialidad');
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar
        user={{
          nombre: profile.nombre,
          avatarUrl: profile.avatar_url,
          titulo: terapeuta?.titulo ?? 'Terapeuta',
        }}
      />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>

      {/* Alertas de crisis en vivo (#4) — visibles en cualquier pantalla */}
      <AlertasCrisisEnVivo />

      {/* Registros emocionales llegando en vivo (#6) */}
      <RegistrosEnVivo />
    </div>
  );
}
