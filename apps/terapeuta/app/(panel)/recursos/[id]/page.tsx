import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { EditorPlantilla } from '@/components/recursos/EditorPlantilla';
import type { CampoGuardado } from '@/components/recursos/EditorPreguntas';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

const CATEGORIAS_TERAPEUTA = new Set(['formato_nom004', 'formato_terapeuta']);

export default async function RecursoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: p }, { data: { user } }] = await Promise.all([
    supabase
      .from('plantillas_ejercicios')
      .select('id, titulo, descripcion, categoria, contenido_md, campos_respuesta, duracion_min, tipo, terapeuta_id')
      .eq('id', id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!p) notFound();

  const campos = (Array.isArray(p.campos_respuesta) ? p.campos_respuesta : []) as unknown as CampoGuardado[];
  const esFormatoTerapeuta = CATEGORIAS_TERAPEUTA.has(p.categoria);
  const esMia = !!user && p.terapeuta_id === user.id;
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

      <EditorPlantilla
        id={p.id}
        titulo={p.titulo}
        descripcion={p.descripcion}
        contenido={p.contenido_md}
        campos={campos}
        etiqueta={etiqueta}
        esMia={esMia}
        esFormatoTerapeuta={esFormatoTerapeuta}
      />

      <p className="mt-5 text-xs text-foreground-muted">
        {esFormatoTerapeuta
          ? 'Formato de uso del terapeuta. Edítalo a tu manera y úsalo para tu expediente.'
          : 'Para asignar este formulario a un paciente, entra a su ficha → pestaña Ejercicios → Asignar.'}
      </p>
    </div>
  );
}
