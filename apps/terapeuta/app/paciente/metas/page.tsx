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
    .select('id, titulo, completado')
    .eq('paciente_id', user.id)
    .order('completado', { ascending: true })
    .order('creado_at', { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Mis metas</h1>
        <p className="mt-1 text-sm text-ink/60">
          Recordatorios y metas que tú defines. Son privados: tu terapeuta no los ve.
        </p>
      </div>
      <MetasClient iniciales={metas ?? []} />
    </div>
  );
}
