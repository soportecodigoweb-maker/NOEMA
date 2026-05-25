import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export const metadata = { title: 'Recursos' };
export const dynamic = 'force-dynamic';

export default async function RecursosPage() {
  const supabase = await createClient();

  // Plantillas oficiales NOEMA + propias del terapeuta (RLS filtra)
  const { data: plantillas } = await supabase
    .from('plantillas_ejercicios')
    .select('id, titulo, descripcion, categoria, duracion_min, tipo, terapeuta_id, usos_count')
    .order('usos_count', { ascending: false })
    .limit(30);

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Biblioteca</h1>
        <p className="text-foreground-muted">
          Plantillas oficiales NOEMA y las tuyas propias para asignar a pacientes.
        </p>
      </div>

      {!plantillas || plantillas.length === 0 ? (
        <Card variant="flat" className="text-center py-12">
          <p className="text-foreground-muted">No hay plantillas disponibles.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((p) => (
            <Card key={p.id} variant="flat" className="hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="caption">{p.categoria}</span>
                {p.terapeuta_id === null && (
                  <span className="caption text-emotion-tranquilo">Oficial NOEMA</span>
                )}
              </div>
              <h3 className="font-sans font-semibold text-ink mb-2">{p.titulo}</h3>
              {p.descripcion && (
                <p className="text-sm text-foreground-muted mb-3 line-clamp-2">
                  {p.descripcion}
                </p>
              )}
              <div className="text-xs text-foreground-muted">
                {p.duracion_min ? `${p.duracion_min} min · ` : ''}
                {p.usos_count} {p.usos_count === 1 ? 'uso' : 'usos'}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
