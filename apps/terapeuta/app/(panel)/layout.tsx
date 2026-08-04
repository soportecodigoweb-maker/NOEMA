import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/nav/Sidebar';
import { AlertasCrisisEnVivo } from '@/components/crisis/AlertasCrisisEnVivo';
import { RegistrosEnVivo } from '@/components/registros/RegistrosEnVivo';
import { AvisoNotificacion } from '@/components/notificaciones/AvisoNotificacion';
import { GuiaAprendiz } from '@/components/aprendiz/GuiaAprendiz';
import { AvisoModoAprendiz } from '@/components/aprendiz/AvisoModoAprendiz';
import { AutoLogout } from '@/components/cuenta/AutoLogout';
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
  const [{ data: profile }, { data: aviso }, { data: terapeuta }, { data: config }] =
    await Promise.all([
    supabase
      .from('profiles')
      .select('id, nombre, avatar_url, rol, onboarding_completo, modo_aprendiz, auto_logout_habilitado, estado_cuenta')
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
      supabase
        .from('configuracion_terapeuta')
        .select(
          'notif_sonido, notif_mensajes, notif_registros, notif_tareas, notif_crisis, no_molestar_activo, no_molestar_desde, no_molestar_hasta',
        )
        .eq('terapeuta_id', user.id)
        .maybeSingle(),
    ]);

  if (!profile) {
    redirect('/signin');
  }

  // Cuenta eliminada (bloqueada y archivada): sin acceso.
  if (profile.estado_cuenta === 'eliminada') {
    await supabase.auth.signOut();
    redirect('/signin?motivo=cuenta-eliminada');
  }

  // Panel exclusivo del terapeuta. El dueño de NOEMA (admin) y los centros van
  // a su propio panel aislado.
  if (profile.rol !== 'terapeuta') {
    redirect(
      profile.rol === 'admin' ? '/admin' : profile.rol === 'centro' ? '/centro' : '/paciente',
    );
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
      <AlertasCrisisEnVivo habilitado={config?.notif_crisis ?? true} />

      {/* Registros emocionales llegando en vivo (#6) */}
      <RegistrosEnVivo />

      {/* Tour guiado (modo aprendiz) + aviso de dónde activarlo */}
      <GuiaAprendiz activo={profile.modo_aprendiz} />
      <AvisoModoAprendiz />

      {/* Auto-cierre de sesión por inactividad (si el terapeuta lo activó) */}
      <AutoLogout habilitado={profile.auto_logout_habilitado} />

      {/* Aviso emergente, según Ajustes → Mis notificaciones */}
      <AvisoNotificacion
        preferencias={{
          sonido: (config?.notif_sonido ?? 'suave') as 'suave' | 'campana' | 'silencioso',
          mensajes: config?.notif_mensajes ?? true,
          registros: config?.notif_registros ?? true,
          tareas: config?.notif_tareas ?? true,
          noMolestarActivo: config?.no_molestar_activo ?? false,
          noMolestarDesde: config?.no_molestar_desde ?? '21:00',
          noMolestarHasta: config?.no_molestar_hasta ?? '08:00',
        }}
      />
    </div>
  );
}
