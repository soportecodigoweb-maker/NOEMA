import Link from 'next/link';
import { FolderLock, FolderHeart, FileText, Paperclip, Building2 } from 'lucide-react';
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Asegura que el terapeuta tenga su copia editable de cada plantilla oficial,
  // de forma transparente (idempotente). Así todo lo que ve es suyo y editable.
  if (user) await supabase.rpc('asegurar_plantillas_terapeuta');

  const { data: plantillas } = await supabase
    .from('plantillas_ejercicios')
    .select('id, titulo, descripcion, categoria, duracion_min, tipo, terapeuta_id, usos_count, recursos')
    .eq('terapeuta_id', user?.id ?? '')
    .order('categoria')
    .order('usos_count', { ascending: false })
    .limit(120);

  // Recursos que el centro comparte con sus terapeutas (si pertenece a uno).
  const { data: membresia } = await supabase
    .from('centro_terapeutas')
    .select('centro_id')
    .eq('terapeuta_id', user?.id ?? '')
    .eq('estado', 'activa')
    .maybeSingle();
  let recursosCentro: { id: string; titulo: string; tipo: string; nota: string | null; url: string | null; ruta: string | null }[] = [];
  let nombreCentro = '';
  if (membresia) {
    const [{ data: rc }, { data: c }] = await Promise.all([
      supabase
        .from('centro_recursos')
        .select('id, titulo, tipo, nota, url, ruta')
        .eq('centro_id', membresia.centro_id)
        .order('creado_at', { ascending: false }),
      supabase.from('centros').select('nombre_centro').eq('profile_id', membresia.centro_id).maybeSingle(),
    ]);
    recursosCentro = rc ?? [];
    nombreCentro = c?.nombre_centro ?? 'tu centro';
  }

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

      {/* Carpeta: recursos que comparte el centro */}
      {recursosCentro.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 flex items-center gap-2 font-serif text-2xl text-ink">
            <Building2 className="size-6 text-noema-sage" /> Recursos de {nombreCentro}
          </h2>
          <p className="mb-3 text-sm text-foreground-muted">
            Materiales que tu centro comparte con el equipo.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recursosCentro.map((r) => (
              <li key={r.id} className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.05] p-4">
                <span className="rounded bg-noema-sage/15 px-2 py-0.5 text-[11px] capitalize text-noema-sage">
                  {r.tipo}
                </span>
                <p className="mt-2 font-medium text-ink">{r.titulo}</p>
                {r.nota && <p className="mt-0.5 text-xs text-foreground-muted">{r.nota}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-noema-sage hover:underline">
                      Abrir enlace
                    </a>
                  )}
                  {r.ruta && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/centro-recursos/${r.ruta}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-noema-sage hover:underline"
                    >
                      Abrir archivo
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
