import { redirect } from 'next/navigation';
import { PacienteNav } from '@/components/paciente/PacienteNav';
import { createClient } from '@/lib/supabase/server';

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

  // Buscar terapeuta vinculado (si tiene) para mostrar nombre en nav
  const { data: vinculacion } = await supabase
    .from('vinculaciones')
    .select('terapeuta:profiles!vinculaciones_terapeuta_id_fkey(nombre)')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  const terapeutaRaw = vinculacion?.terapeuta as
    | { nombre?: string }
    | { nombre?: string }[]
    | null
    | undefined;
  const terapeutaNombre = Array.isArray(terapeutaRaw)
    ? terapeutaRaw[0]?.nombre ?? null
    : terapeutaRaw?.nombre ?? null;

  return (
    <div className="flex min-h-screen bg-paper">
      <PacienteNav
        user={{
          nombre: profile.nombre,
          avatarUrl: profile.avatar_url,
          terapeutaNombre,
        }}
      />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
