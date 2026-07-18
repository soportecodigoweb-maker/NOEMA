import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { NotasEditor } from './NotasEditor';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NotasPacientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: notasRow } = await supabase
    .from('vinculacion_notas_privadas')
    .select('contenido')
    .eq('vinculacion_id', id)
    .maybeSingle();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-serif text-2xl text-ink mb-1">Notas privadas</h2>
        <p className="text-sm text-foreground-muted flex items-center gap-1">
          <Lock className="size-3" /> Solo tú puedes verlas. El paciente jamás accede.
        </p>
      </div>

      <Card>
        <NotasEditor
          vinculacionId={id}
          initial={notasRow?.contenido ?? ''}
        />
      </Card>
    </div>
  );
}
