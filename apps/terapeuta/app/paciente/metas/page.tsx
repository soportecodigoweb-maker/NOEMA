import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MetasClient } from '@/components/paciente/MetasClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis metas' };

export default async function MetasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: metas } = await supabase
    .from('recordatorios_personales')
    .select('id, titulo, tipo, recurrencia, completado, completado_at')
    .eq('paciente_id', user.id)
    .order('creado_at', { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Mis metas y objetivos</h1>
        <p className="mt-1 text-sm text-ink/60">
          Tus objetivos del día y tus metas a corto, mediano y largo plazo. Son
          privados: tu terapeuta no los ve.
        </p>
      </div>
      <MetasClient iniciales={metas ?? []} />
    </div>
  );
}
