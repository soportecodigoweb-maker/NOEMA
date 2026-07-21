import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { PacienteNav } from '@/components/paciente/PacienteNav';
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nombre, avatar_url, rol')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/signin');
  }

  if (profile.rol !== 'paciente' && profile.rol !== 'sin_terapeuta') {
    await supabase.auth.signOut();
    redirect('/signin?type=wrong-role');
  }

  // Aviso de privacidad al entrar (#8): el paciente debe aceptar la versión vigente.
  const { data: aviso } = await supabase
    .from('consentimientos')
    .select('id')
    .eq('profile_id', user.id)
    .eq('tipo', 'aviso_privacidad')
    .eq('version', VERSION_AVISO_PACIENTE)
    .eq('aceptado', true)
    .limit(1)
    .maybeSingle();

  if (!aviso) {
    redirect('/aviso-paciente');
  }

  // Terapeuta vinculado (query separada — el FK apunta a terapeutas, no profiles)
  const { data: vinculacion } = await supabase
    .from('vinculaciones')
    .select('terapeuta_id')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  let terapeutaNombre: string | null = null;
  if (vinculacion?.terapeuta_id) {
    const { data: t } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', vinculacion.terapeuta_id)
      .maybeSingle();
    terapeutaNombre = t?.nombre ?? null;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <PacienteNav
        user={{
          nombre: profile.nombre,
          avatarUrl: profile.avatar_url,
          terapeutaNombre,
        }}
      />
      <main className="flex-1 overflow-x-hidden pb-24 lg:pb-0">{children}</main>

      {/* Botón de crisis flotante — siempre visible (#10) */}
      <Link
        href="/paciente/crisis"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-noema-clay px-5 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Necesito apoyo ahora"
      >
        <LifeBuoy className="size-5" strokeWidth={1.9} />
        <span className="hidden sm:inline">Necesito apoyo</span>
      </Link>
    </div>
  );
}
