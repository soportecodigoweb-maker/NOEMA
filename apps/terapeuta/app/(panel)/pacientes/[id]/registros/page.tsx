import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatFecha } from '@/lib/utils';
import { Bookmark } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PacienteRegistrosPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('paciente_id')
    .eq('id', id)
    .single();

  if (!vinc?.paciente_id) {
    return (
      <Card variant="flat" className="text-center py-12">
        <p className="text-foreground-muted">
          Aún no hay paciente vinculado.
        </p>
      </Card>
    );
  }

  // RLS filtra automáticamente: solo veremos compartido + marcado_sesion
  const { data: registros } = await supabase
    .from('registros_emocionales')
    .select(
      'id, fecha, hora, emocion_principal_key, intensidad, descripcion, situacion_detonante, privacidad',
    )
    .eq('paciente_id', vinc.paciente_id)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-ink mb-1">Registros emocionales</h2>
        <p className="text-sm text-foreground-muted">
          Lo que tu paciente compartió contigo. Las entradas marcadas con{' '}
          <Bookmark className="inline size-3 fill-noema-sage stroke-noema-sage" />{' '}
          son las que quiere revisar en sesión.
        </p>
      </div>

      {!registros || registros.length === 0 ? (
        <Card variant="flat" className="text-center py-12">
          <p className="text-foreground-muted">
            Aún no hay registros compartidos. Tu paciente decide qué compartir.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {registros.map((r) => (
            <Card key={r.id} variant="flat" className="hover:bg-paper/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="text-center shrink-0 w-14">
                  <p className="font-serif text-2xl text-ink">{new Date(r.fecha).getDate()}</p>
                  <p className="caption">
                    {new Date(r.fecha).toLocaleDateString('es-MX', { month: 'short' })}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-ink capitalize">
                      {r.emocion_principal_key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      Intensidad {r.intensidad}/5
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {r.hora.slice(0, 5)}
                    </span>
                    {r.privacidad === 'marcado_sesion' && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-noema-sage font-medium">
                        <Bookmark className="size-3 fill-noema-sage" />
                        Para sesión
                      </span>
                    )}
                  </div>

                  {r.descripcion && (
                    <p className="text-sm text-ink/80 mb-2 leading-relaxed">
                      {r.descripcion}
                    </p>
                  )}
                  {r.situacion_detonante && (
                    <p className="text-xs text-foreground-muted">
                      Situación: {r.situacion_detonante}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
