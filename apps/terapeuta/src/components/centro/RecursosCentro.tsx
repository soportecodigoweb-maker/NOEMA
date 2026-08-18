'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Upload, FileText, Image as ImageIcon, Video, Link2, Paperclip } from 'lucide-react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import {
  agregarRecursoCentroAction,
  eliminarRecursoCentroAction,
} from '../../../app/centro/gestion-actions';

interface Recurso {
  id: string;
  titulo: string;
  tipo: string;
  url: string | null;
  nota: string | null;
  ruta?: string | null;
  tipo_mime?: string | null;
}

const ICONO: Record<string, typeof FileText> = {
  video: Video,
  enlace: Link2,
  imagen: ImageIcon,
};

const TIPOS = ['documento', 'protocolo', 'formato', 'capacitacion', 'video', 'enlace', 'otro'];
const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function RecursosCentro({ inicial }: { inicial: Recurso[] }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('documento');
  const [url, setUrl] = useState('');
  const [nota, setNota] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputFile = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const agregar = async () => {
    if (!titulo.trim()) return;
    setError(null);

    // Si hay archivo, primero se sube al almacenamiento del centro.
    let adjunto: { ruta: string; tipoMime: string; tamano: number } | null = null;
    if (archivo) {
      setSubiendo(true);
      try {
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('sesion');
        const ext = archivo.name.split('.').pop() ?? 'bin';
        const ruta = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('centro-recursos')
          .upload(ruta, archivo, { contentType: archivo.type });
        if (upErr) throw upErr;
        adjunto = { ruta, tipoMime: archivo.type, tamano: archivo.size };
      } catch {
        setSubiendo(false);
        setError('No se pudo subir el archivo. Intenta de nuevo.');
        return;
      }
      setSubiendo(false);
    }

    startTransition(async () => {
      await agregarRecursoCentroAction(titulo, tipo, url, nota, adjunto);
      setTitulo('');
      setUrl('');
      setNota('');
      setArchivo(null);
      if (inputFile.current) inputFile.current.value = '';
      router.refresh();
    });
  };

  const borrar = (id: string) => {
    startTransition(async () => {
      await eliminarRecursoCentroAction(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
          <Plus className="size-5 text-noema-sage" /> Compartir un recurso
        </h2>
        <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
          <select className={input} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
          <input className={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (ej. Protocolo de primera consulta)" />
        </div>
        <input className={`${input} mt-2`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enlace (Drive, PDF, video…) — opcional" />
        <input className={`${input} mt-2`} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota o instrucción — opcional" />

        {/* Adjuntar archivo: PDF, imagen o video */}
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-noema-deep/20 p-3">
          <input
            ref={inputFile}
            type="file"
            accept=".pdf,image/*,video/*,.doc,.docx"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="hidden"
            id="archivo-recurso"
          />
          <label
            htmlFor="archivo-recurso"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-noema-deep/15 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-noema-sage/40"
          >
            <Upload className="size-3.5" /> Adjuntar archivo
          </label>
          <span className="min-w-0 flex-1 truncate text-xs text-foreground-muted">
            {archivo ? archivo.name : 'PDF, imagen o video (hasta 100 MB) — opcional'}
          </span>
          {archivo && (
            <button
              onClick={() => {
                setArchivo(null);
                if (inputFile.current) inputFile.current.value = '';
              }}
              className="text-xs text-foreground-muted hover:text-ink"
            >
              Quitar
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={agregar}
          disabled={!titulo.trim() || subiendo}
          className="mt-3 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {subiendo ? 'Subiendo archivo…' : 'Publicar recurso'}
        </button>
      </section>

      {inicial.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
          Aún no compartes recursos con tus terapeutas.
        </p>
      ) : (
        <ul className="space-y-2">
          {inicial.map((r) => (
            <li key={r.id} className="flex items-start gap-3 rounded-xl border border-noema-deep/10 bg-white px-4 py-3">
              <span className="mt-0.5 shrink-0 rounded bg-noema-sage/10 px-2 py-0.5 text-[11px] capitalize text-noema-sage">
                {r.tipo}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{r.titulo}</p>
                {r.nota && <p className="text-xs text-foreground-muted">{r.nota}</p>}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-noema-sage hover:underline">
                    {r.url}
                  </a>
                )}
                {r.ruta && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/centro-recursos/${r.ruta}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-noema-sage/10 px-2 py-1 text-xs font-medium text-noema-sage hover:bg-noema-sage/20"
                  >
                    <Paperclip className="size-3" /> Abrir archivo
                  </a>
                )}
              </div>
              <button onClick={() => borrar(r.id)} aria-label="Eliminar" className="shrink-0 text-ink/30 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
