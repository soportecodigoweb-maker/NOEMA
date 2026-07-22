import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { HojaMembretada } from '@/components/ui/HojaMembretada';

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

const CATEGORIAS_TERAPEUTA = new Set(['formato_nom004', 'formato_terapeuta']);

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
  const esFormatoTerapeuta = CATEGORIAS_TERAPEUTA.has(p.categoria);
  const etiqueta =
    (p.categoria?.replace(/_/g, ' ') ?? 'recurso') + (p.duracion_min ? ` · ${p.duracion_min} min` : '');

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href="/recursos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" strokeWidth={1.6} />
        Biblioteca
      </Link>

      <HojaMembretada
        titulo={p.titulo}
        subtitulo={p.descripcion}
        etiqueta={etiqueta}
        pie={
          esFormatoTerapeuta ? (
            <p className="text-[11px] leading-relaxed text-foreground-muted">
              Formato de uso del terapeuta · Documento clínico conforme a la NOM-004-SSA3-2012
              (borrador, validar con criterio profesional).
            </p>
          ) : undefined
        }
      >
        {p.contenido_md ? (
          <div className="whitespace-pre-wrap font-sans text-[0.95rem] leading-relaxed text-ink/85">
            {p.contenido_md}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-noema-deep/15 bg-bone/40 p-8 text-center">
            <FileText className="mx-auto mb-2 size-6 text-foreground-muted" strokeWidth={1.5} />
            <p className="text-sm text-foreground-muted">
              Este recurso aún no tiene contenido. Puedes crear tu propia versión con
              “Nuevo recurso” en la biblioteca.
            </p>
          </div>
        )}

        {/* Campos que responderá el paciente */}
        {campos.length > 0 && (
          <div className="mt-7 border-t border-noema-deep/8 pt-5">
            <h3 className="caption mb-3">Preguntas que responderá el paciente</h3>
            <ol className="space-y-2">
              {campos.map((c, i) => (
                <li
                  key={c.key}
                  className="flex items-start gap-3 rounded-lg border border-noema-deep/10 bg-bone/30 px-4 py-2.5 text-sm"
                >
                  <span className="mt-0.5 font-serif text-noema-sage">{i + 1}.</span>
                  <span className="flex-1">
                    <span className="font-medium text-ink">{c.label}</span>
                    <span className="ml-2 text-xs text-foreground-muted">
                      ({tipoLabel(c.type)}
                      {c.options ? `: ${c.options.join(' / ')}` : ''})
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </HojaMembretada>

      <p className="mt-5 text-xs text-foreground-muted">
        {esFormatoTerapeuta
          ? 'Este es un formato de uso del terapeuta. Descárgalo o cópialo para tu expediente; no se envía como tarea al paciente.'
          : 'Para asignar este recurso a un paciente, entra a su ficha → pestaña Ejercicios → Asignar.'}
      </p>
    </div>
  );
}

function tipoLabel(type: string): string {
  const map: Record<string, string> = {
    text: 'texto',
    scale: 'escala',
    choice: 'opción',
  };
  return map[type] ?? type;
}
