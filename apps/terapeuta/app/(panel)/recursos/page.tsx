import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { NuevaPlantilla } from '@/components/recursos/NuevaPlantilla';

export const metadata = { title: 'Biblioteca' };
export const dynamic = 'force-dynamic';

export default async function RecursosPage() {
  const supabase = await createClient();

  const { data: plantillas } = await supabase
    .from('plantillas_ejercicios')
    .select('id, titulo, descripcion, categoria, duracion_min, tipo, terapeuta_id, usos_count')
    .order('categoria')
    .order('usos_count', { ascending: false })
    .limit(60);

  const lista = plantillas ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-serif text-4xl leading-tight text-ink">Biblioteca</h1>
          <p className="text-foreground-muted">
            Plantillas, formatos y recursos. Ábrelos para verlos y asignarlos a tus pacientes.
          </p>
        </div>
        <NuevaPlantilla />
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white py-12 text-center text-foreground-muted">
          No hay recursos. Crea uno con “Nuevo recurso”.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p) => (
            <Link
              key={p.id}
              href={`/recursos/${p.id}`}
              className="group flex flex-col rounded-2xl border border-noema-deep/10 bg-white p-5 transition-shadow hover:shadow-soft"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="caption">{p.categoria?.replace(/_/g, ' ')}</span>
                {p.terapeuta_id === null ? (
                  <span className="caption text-emotion-tranquilo">Oficial NOEMA</span>
                ) : (
                  <span className="caption text-noema-sage">Mío</span>
                )}
              </div>
              <h3 className="font-sans font-semibold text-ink group-hover:text-noema-deep">
                {p.titulo}
              </h3>
              {p.descripcion && (
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-foreground-muted">
                  {p.descripcion}
                </p>
              )}
              <div className="mt-3 text-xs text-noema-sage">Abrir →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
