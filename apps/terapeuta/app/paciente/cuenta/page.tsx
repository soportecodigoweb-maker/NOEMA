import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ZonaCuenta } from '@/components/cuenta/ZonaCuenta';
import { SubirAvatar } from '@/components/cuenta/SubirAvatar';
import { ToggleAprendiz } from '@/components/aprendiz/ToggleAprendiz';
import { ToggleSonidosUI } from '@/components/sonidos/ToggleSonidosUI';
import { ToggleAutoLogout } from '@/components/cuenta/ToggleAutoLogout';
import { MiTerapeuta } from '@/components/paciente/MiTerapeuta';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi cuenta' };

export default async function CuentaPacientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [{ data: profile }, { data: vinc }] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre, avatar_url, modo_aprendiz, auto_logout_habilitado')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('vinculaciones')
      .select('terapeuta_id')
      .eq('paciente_id', user.id)
      .in('estado', ['activa', 'pausada'])
      .order('fecha_inicio', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let terapeutaNombre: string | null = null;
  if (vinc?.terapeuta_id) {
    const { data: tp } = await supabase
      .from('profiles')
      .select('nombre, apellidos')
      .eq('id', vinc.terapeuta_id)
      .maybeSingle();
    terapeutaNombre = [tp?.nombre, tp?.apellidos].filter(Boolean).join(' ') || 'Tu terapeuta';
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Mi cuenta</h1>
      <p className="mt-1 text-sm text-ink/60">
        Tu foto de perfil, cerrar sesión o eliminar tu cuenta.
      </p>

      <div className="mt-6 rounded-2xl border border-noema-deep/10 bg-white p-6">
        <SubirAvatar
          userId={user.id}
          avatarUrl={profile?.avatar_url ?? null}
          nombre={profile?.nombre ?? ''}
        />
      </div>

      {/* Mi terapeuta + opción de desvincularme */}
      {terapeutaNombre && (
        <div className="mt-4">
          <MiTerapeuta terapeutaNombre={terapeutaNombre} />
        </div>
      )}

      <div className="mt-4">
        <ToggleAprendiz inicial={profile?.modo_aprendiz ?? true} />
      </div>

      <div className="mt-4">
        <ToggleSonidosUI />
      </div>

      <div className="mt-4">
        <ToggleAutoLogout inicial={profile?.auto_logout_habilitado ?? false} />
      </div>

      <div className="mt-4">
        <ZonaCuenta />
      </div>
    </div>
  );
}
