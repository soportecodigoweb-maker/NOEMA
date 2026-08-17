import { redirect } from 'next/navigation';
import { Library } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { RecursosCentro } from '@/components/centro/RecursosCentro';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recursos · Centro' };

export default async function RecursosCentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data } = await supabase
    .from('centro_recursos')
    .select('id, titulo, tipo, url, nota')
    .eq('centro_id', user.id)
    .order('creado_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Library className="size-7 text-noema-sage" /> Recursos para terapeutas
        </h1>
        <p className="text-sm text-foreground-muted">
          Protocolos, formatos, capacitaciones y materiales que tus terapeutas pueden consultar.
        </p>
      </div>
      <RecursosCentro inicial={data ?? []} />
    </div>
  );
}
