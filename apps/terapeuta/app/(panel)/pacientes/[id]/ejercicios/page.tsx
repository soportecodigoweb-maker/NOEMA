import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { AsignarEjercicioDialog } from './AsignarEjercicioDialog';
import { formatFecha, tiempoRelativo } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  estado: string;
  creado_at: string;
  respuestas: Array<{ id: string; fecha: string; texto_libre: string | null; dificultad_percibida: number | null }>;
}

export default async function EjerciciosPacientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tareas }, { data: plantillas }] = await Promise.all([
    supabase
      .from('tareas')
      .select(`
        id, titulo, descripcion, fecha_limite, estado, creado_at,
        respuestas:tarea_respuestas(id, fecha, texto_libre, dificultad_percibida)
      `)
      .eq('vinculacion_id', id)
      .order('creado_at', { ascending: false }),
    supabase
      .from('plantillas_ejercicios')
      .select('id, titulo, descripcion, categoria, duracion_min')
      .order('titulo')
      .limit(50),
  ]);

  const lista = (tareas as Tarea[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink mb-1">Ejercicios y tareas</h2>
          <p className="text-sm text-foreground-muted">
            Lo que asignaste y cómo ha respondido el paciente.
          </p>
        </div>
        <AsignarEjercicioDialog
          vinculacionId={id}
          plantillas={(plantillas as any) ?? []}
        />
      </div>

      {lista.length === 0 ? (
        <Card variant="flat" className="text-center py-12">
          <p className="text-foreground-muted">
            Asigna una plantilla de la biblioteca para empezar.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {lista.map((t) => (
            <Card key={t.id} variant="flat" className="hover:bg-paper/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <EstadoBadge estado={t.estado} />
                    <span className="text-xs text-foreground-muted">
                      Asignada {tiempoRelativo(t.creado_at).toLowerCase()}
                    </span>
                    {t.fecha_limite && (
                      <span className="text-xs text-[#B85450]">
                        Hasta {formatFecha(t.fecha_limite)}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-ink">{t.titulo}</p>
                  {t.descripcion && (
                    <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                      {t.descripcion}
                    </p>
                  )}
                  {t.respuestas && t.respuestas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="caption">{t.respuestas.length} respuesta(s) del paciente</p>
                      {t.respuestas.slice(0, 2).map((r) => (
                        <div key={r.id} className="text-sm border-l-2 border-noema-sage/40 pl-3 py-1">
                          {r.texto_libre && (
                            <p className="text-ink/80 italic">"{r.texto_libre}"</p>
                          )}
                          <p className="text-xs text-foreground-muted mt-1">
                            {formatFecha(r.fecha)}
                            {r.dificultad_percibida !== null &&
                              ` · Dificultad ${r.dificultad_percibida}/5`}
                          </p>
                        </div>
                      ))}
                    </div>
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

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-emotion-cansado/30 text-ink/70' },
    en_progreso: { label: 'En progreso', color: 'bg-noema-sage/15 text-noema-deep' },
    completada: { label: 'Completada', color: 'bg-emotion-tranquilo/40 text-ink/70' },
    archivada: { label: 'Archivada', color: 'bg-noema-deep/10 text-ink/50' },
  };
  const v = map[estado] ?? map.pendiente!;
  return <span className={`caption px-2 py-1 rounded ${v.color}`}>{v.label}</span>;
}
