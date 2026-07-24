import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { PacienteNav } from '@/components/paciente/PacienteNav';
import { AvisoNotificacion } from '@/components/notificaciones/AvisoNotificacion';
import { createClient } from '@/lib/supabase/server';
import { VERSION_AVISO_PACIENTE } from '@/lib/aviso-privacidad-paciente';

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Profile, aviso y vinculación dependen solo de user.id → en paralelo.
  const [{ data: profile }, { data: aviso }, { data: vinculacion }] = await Promise.all([
    supabase.from('profiles').select('id, nombre, avatar_url, rol').eq('id', user.id).single(),
    supabase
      .from('consentimientos')
      .select('id')
      .eq('profile_id', user.id)
      .eq('tipo', 'aviso_privacidad')
      .eq('version', VERSION_AVISO_PACIENTE)
      .eq('aceptado', true)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('vinculaciones')
      .select(
        'terapeuta_id, sos_habilitado, chat_habilitado, diario_habilitado, registros_habilitados, tareas_habilitadas, progreso_habilitado, agenda_habilitada',
      )
      .eq('paciente_id', user.id)
      .eq('estado', 'activa')
      .maybeSingle(),
  ]);

  if (!profile) {
    redirect('/signin');
  }

  if (profile.rol !== 'paciente' && profile.rol !== 'sin_terapeuta') {
    await supabase.auth.signOut();
    redirect('/signin?type=wrong-role');
  }

  // Aviso de privacidad al entrar (#8): el paciente debe aceptar la versión vigente.
  if (!aviso) {
    redirect('/aviso-paciente');
  }

  // Nombre del terapeuta vinculado (query separada — el FK apunta a terapeutas,
  // no a profiles, así que no se puede usar embed).

  let terapeutaNombre: string | null = null;
  if (vinculacion?.terapeuta_id) {
    const { data: t } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', vinculacion.terapeuta_id)
      .maybeSingle();
    terapeutaNombre = t?.nombre ?? null;
  }

  // Funciones que su terapeuta le habilitó (Ajustes → Funciones del paciente).
  // Sin vinculación aún, se muestra todo lo que no depende del terapeuta.
  const funciones = {
    sos: vinculacion?.sos_habilitado ?? true,
    chat: vinculacion?.chat_habilitado ?? true,
    diario: vinculacion?.diario_habilitado ?? true,
    registros: vinculacion?.registros_habilitados ?? true,
    tareas: vinculacion?.tareas_habilitadas ?? true,
    progreso: vinculacion?.progreso_habilitado ?? true,
    agenda: vinculacion?.agenda_habilitada ?? false,
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <PacienteNav
        user={{
          nombre: profile.nombre,
          avatarUrl: profile.avatar_url,
          terapeutaNombre,
        }}
        funciones={funciones}
      />
      <main className="min-w-0 flex-1 overflow-x-hidden pb-24 lg:pb-0">{children}</main>

      {/* Botón de apoyo flotante — verde, visible; solo si el terapeuta lo habilitó */}
      {funciones.sos && (
        <Link
          href="/paciente/crisis"
          className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-noema-sage px-5 py-3.5 text-sm font-semibold text-bone shadow-[0_8px_24px_-6px_rgba(61,77,62,0.6)] ring-4 ring-noema-sage/20 transition-transform hover:scale-105 lg:bottom-5"
          aria-label="Necesito apoyo ahora"
        >
          <LifeBuoy className="size-5" strokeWidth={2} />
          Necesito apoyo
        </Link>
      )}

      {/* Aviso emergente de mensajes del terapeuta */}
      <AvisoNotificacion />
    </div>
  );
}
