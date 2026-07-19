import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { NotasEditor } from './NotasEditor';
import { AdjuntosExpediente } from '@/components/pacientes/AdjuntosExpediente';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NotasPacientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: notasRow }, { data: adjuntos }] = await Promise.all([
    supabase
      .from('vinculacion_notas_privadas')
      .select('contenido')
      .eq('vinculacion_id', id)
      .maybeSingle(),
    supabase
      .from('adjuntos')
      .select('id, ruta, nombre, tipo_mime, creado_at')
      .eq('vinculacion_id', id)
      .eq('archivado', false)
      .order('creado_at', { ascending: false }),
  ]);

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

      <Card>
        <AdjuntosExpediente vinculacionId={id} iniciales={adjuntos ?? []} />
      </Card>
    </div>
  );
}
