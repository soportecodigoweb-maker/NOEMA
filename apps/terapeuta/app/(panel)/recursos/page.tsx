import Link from 'next/link';
import { FolderLock, FolderHeart, FileText, Paperclip } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { NuevaPlantilla } from '@/components/recursos/NuevaPlantilla';

export const metadata = { title: 'Biblioteca' };
export const dynamic = 'force-dynamic';

interface Plantilla {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  duracion_min: number | null;
  tipo: string;
  terapeuta_id: string | null;
  usos_count: number | null;
  recursos: unknown;
}

// Categorías que son documentos de uso del terapeuta (no se envían al paciente).
const CATEGORIAS_TERAPEUTA = new Set(['formato_nom004', 'formato_terapeuta']);

export default async function RecursosPage() {
  const supabase = await createClient();

  const [{ data: plantillas }, { data: { user } }] = await Promise.all([
    supabase
      .from('plantillas_ejercicios')
      .select('id, titulo, descripcion, categoria, duracion_min, tipo, terapeuta_id, usos_count, recursos')
      .order('categoria')
      .order('usos_count', { ascending: false })
      .limit(80),
    supabase.auth.getUser(),
  ]);

  const lista = (plantillas ?? []) as Plantilla[];
  const formatosTerapeuta = lista.filter((p) => CATEGORIAS_TERAPEUTA.has(p.categoria));
  const recursosPaciente = lista.filter((p) => !CATEGORIAS_TERAPEUTA.has(p.categoria));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-serif text-4xl leading-tight text-ink">Biblioteca</h1>
          <p className="text-foreground-muted">
            Plantillas, formatos y materiales (lecturas, PDF, audios, enlaces),
            organizados en carpetas.
          </p>
        </div>
        <NuevaPlantilla terapeutaId={user?.id ?? ''} />
      </div>

      {/* Carpeta: formatos del terapeuta (uso interno) */}
      <Carpeta
        icon={<FolderLock className="size-5 text-noema-deep" strokeWidth={1.6} />}
        titulo="Formatos del terapeuta"
        nota="Uso interno · documentos clínicos (no se envían al paciente)"
        vacio="Aún no hay formatos del terapeuta."
      >
        {formatosTerapeuta}
      </Carpeta>

      {/* Carpeta: recursos y plantillas para pacientes */}
      <Carpeta
        icon={<FolderHeart className="size-5 text-noema-sage" strokeWidth={1.6} />}
        titulo="Recursos y plantillas para pacientes"
        nota="Ejercicios y tareas que puedes asignar a tus pacientes"
        vacio="No hay recursos para pacientes. Crea uno con “Nuevo recurso”."
      >
        {recursosPaciente}
      </Carpeta>
    </div>
  );
}

function Carpeta({
  icon,
  titulo,
  nota,
  vacio,
  children,
}: {
  icon: React.ReactNode;
  titulo: string;
  nota: string;
  vacio: string;
  children: Plantilla[];
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-3 border-b border-noema-deep/8 pb-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-noema-deep/5">
          {icon}
        </div>
        <div>
          <h2 className="font-serif text-xl text-ink">{titulo}</h2>
          <p className="text-xs text-foreground-muted">{nota}</p>
        </div>
        <span className="ml-auto rounded-full bg-noema-deep/6 px-2.5 py-1 text-xs font-medium text-noema-deep/60">
          {children.length}
        </span>
      </div>

      {children.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white py-10 text-center text-sm text-foreground-muted">
          {vacio}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((p) => (
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
              <div className="mb-1 flex items-center gap-2">
                <FileText className="size-4 shrink-0 text-noema-deep/40" strokeWidth={1.6} />
                <h3 className="font-sans font-semibold text-ink group-hover:text-noema-deep">
                  {p.titulo}
                </h3>
              </div>
              {p.descripcion && (
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-foreground-muted">
                  {p.descripcion}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-noema-sage">
                <span>Abrir →</span>
                {Array.isArray(p.recursos) && p.recursos.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-foreground-muted">
                    <Paperclip className="size-3" strokeWidth={1.8} />
                    {p.recursos.length}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
