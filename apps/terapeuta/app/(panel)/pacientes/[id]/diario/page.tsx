import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { formatFecha } from '@/lib/utils';
import { Bookmark, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PacienteDiarioPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('paciente_id')
    .eq('id', id)
    .single();

  if (!vinc?.paciente_id) {
    return (
      <Card variant="flat" className="py-12 text-center">
        <p className="text-foreground-muted">Aún no hay paciente vinculado.</p>
      </Card>
    );
  }

  // La RLS solo devuelve entradas compartidas o marcadas para sesión.
  // Las entradas privadas NUNCA llegan al terapeuta.
  const { data: entradas } = await supabase
    .from('diario_entradas')
    .select('id, fecha, titulo, contenido, privacidad, tags, creado_at')
    .eq('paciente_id', vinc.paciente_id)
    .order('fecha', { ascending: false })
    .order('creado_at', { ascending: false })
    .limit(100);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="mb-1 font-serif text-2xl text-ink">Diario</h2>
        <p className="text-sm text-foreground-muted">
          Solo ves las entradas que tu paciente decidió compartir. Lo que marca como
          privado es su espacio y nunca te llega. Las marcadas con{' '}
          <Bookmark className="inline size-3 fill-noema-sage stroke-noema-sage" /> son
          las que quiere revisar en sesión.
        </p>
      </div>

      {!entradas || entradas.length === 0 ? (
        <Card variant="flat" className="py-12 text-center">
          <BookOpen className="mx-auto mb-2 size-6 text-foreground-muted" strokeWidth={1.5} />
          <p className="text-foreground-muted">
            Aún no hay entradas de diario compartidas.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {entradas.map((e) => (
            <Card key={e.id} variant="flat">
              <div className="mb-1.5 flex items-center gap-3">
                <span className="text-xs text-foreground-muted">{formatFecha(e.fecha)}</span>
                {e.privacidad === 'marcado_sesion' && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-noema-sage">
                    <Bookmark className="size-3 fill-noema-sage" />
                    Para sesión
                  </span>
                )}
              </div>
              {e.titulo && <h3 className="font-serif text-lg text-ink">{e.titulo}</h3>}
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                {e.contenido}
              </p>
              {e.tags && e.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-noema-sage/10 px-2 py-0.5 text-[11px] text-noema-deep/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
