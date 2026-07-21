import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Campo {
  key: string;
  label: string;
  type: string;
  options?: string[];
}

export default async function RecursoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: p } = await supabase
    .from('plantillas_ejercicios')
    .select('id, titulo, descripcion, categoria, contenido_md, campos_respuesta, duracion_min, tipo, terapeuta_id')
    .eq('id', id)
    .maybeSingle();

  if (!p) notFound();

  const campos = (Array.isArray(p.campos_respuesta) ? p.campos_respuesta : []) as unknown as Campo[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <Link
        href="/recursos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" strokeWidth={1.6} />
        Biblioteca
      </Link>

      <div className="mb-2 flex items-center gap-2">
        <span className="caption">{p.categoria?.replace(/_/g, ' ')}</span>
        {p.terapeuta_id === null && <span className="caption text-emotion-tranquilo">Oficial NOEMA</span>}
        {p.duracion_min ? <span className="caption text-foreground-muted">· {p.duracion_min} min</span> : null}
      </div>

      <h1 className="mb-3 font-serif text-3xl text-ink">{p.titulo}</h1>
      {p.descripcion && <p className="mb-6 text-ink/70">{p.descripcion}</p>}

      {/* Contenido del recurso */}
      {p.contenido_md ? (
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
            {p.contenido_md}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white p-8 text-center">
          <FileText className="mx-auto mb-2 size-6 text-foreground-muted" strokeWidth={1.5} />
          <p className="text-sm text-foreground-muted">
            Este recurso aún no tiene contenido. Puedes crear tu propia versión con
            “Nuevo recurso” en la biblioteca.
          </p>
        </div>
      )}

      {/* Campos que responderá el paciente */}
      {campos.length > 0 && (
        <div className="mt-6">
          <h2 className="caption mb-3">Campos que responderá el paciente</h2>
          <ul className="space-y-2">
            {campos.map((c) => (
              <li key={c.key} className="rounded-lg border border-noema-deep/10 bg-white px-4 py-2 text-sm">
                <span className="font-medium text-ink">{c.label}</span>
                <span className="ml-2 text-xs text-foreground-muted">
                  ({c.type}{c.options ? `: ${c.options.join(' / ')}` : ''})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 text-xs text-foreground-muted">
        Para asignar este recurso a un paciente, entra a su ficha → pestaña Ejercicios → Asignar.
      </p>
    </div>
  );
}
