import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Bookmark } from 'lucide-react';
import { RetroRegistro } from '@/components/pacientes/RetroRegistro';

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
      'id, fecha, hora, emocion_principal_key, intensidad, descripcion, situacion_detonante, privacidad, retroalimentacion, retroalimentacion_at',
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

                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-xs text-ink/60">{r.hora.slice(0, 5)} h</span>
                    {r.privacidad === 'marcado_sesion' && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-noema-sage">
                        <Bookmark className="size-3 fill-noema-sage" />
                        Para sesión
                      </span>
                    )}
                  </div>

                  {/* Campos separados y etiquetados, para leerlo de un vistazo */}
                  <dl className="space-y-2.5">
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-ink/50">
                        Situación
                      </dt>
                      <dd className="text-sm leading-relaxed text-ink/90">
                        {r.situacion_detonante || 'No la describió'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-ink/50">
                        Emoción
                      </dt>
                      <dd className="text-sm font-medium capitalize text-ink">
                        {r.emocion_principal_key.replace(/_/g, ' ')}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-ink/50">
                        Intensidad
                      </dt>
                      <dd className="flex items-center gap-2">
                        <span className="flex gap-0.5" aria-hidden>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span
                              key={n}
                              className={`h-2 w-5 rounded-full ${
                                n <= r.intensidad ? 'bg-noema-sage' : 'bg-noema-deep/10'
                              }`}
                            />
                          ))}
                        </span>
                        <span className="text-sm font-medium text-ink">{r.intensidad}/5</span>
                      </dd>
                    </div>

                    {r.descripcion && (
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wider text-ink/50">
                          Lo que escribió
                        </dt>
                        <dd className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">
                          {r.descripcion}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* Mensaje / retroalimentación del terapeuta a este registro */}
                  <RetroRegistro
                    registroId={r.id}
                    vinculacionId={id}
                    inicial={r.retroalimentacion}
                    fecha={
                      r.retroalimentacion_at
                        ? new Date(r.retroalimentacion_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : null
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
