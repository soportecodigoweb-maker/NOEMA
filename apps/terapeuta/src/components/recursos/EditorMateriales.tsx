'use client';

import { useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Upload,
  Link2,
  Trash2,
  FileText,
  Music,
  Image as ImageIcon,
  File,
  Plus,
} from 'lucide-react';

export interface Material {
  tipo: 'archivo' | 'enlace';
  titulo: string;
  /** Ruta dentro del bucket 'recursos' (solo tipo='archivo'). */
  ruta?: string;
  /** URL externa (solo tipo='enlace'). */
  url?: string;
  mime?: string;
  tamano?: number;
}

/** Tipos que aceptamos subir: lecturas, PDF, audios, imágenes y documentos. */
const ACEPTA =
  '.pdf,.doc,.docx,.txt,.md,.rtf,.mp3,.m4a,.wav,.ogg,.aac,.jpg,.jpeg,.png,.webp,.mp4';

const MAX_MB = 25;

/**
 * Materiales del recurso (#): el terapeuta sube lecturas, PDF, archivos y
 * audios, o pega enlaces, para pasárselos al paciente.
 *
 * Los archivos van al bucket privado 'recursos' bajo su carpeta
 * "<terapeuta_id>/…"; el paciente vinculado puede leerlos por RLS.
 */
export function EditorMateriales({
  materiales,
  onChange,
  terapeutaId,
}: {
  materiales: Material[];
  onChange: (m: Material[]) => void;
  terapeutaId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuevoEnlace, setNuevoEnlace] = useState({ titulo: '', url: '' });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const subirArchivos = async (files: FileList) => {
    setError(null);
    setSubiendo(true);
    const nuevos: Material[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`"${file.name}" pesa más de ${MAX_MB} MB.`);
        continue;
      }
      const ext = file.name.split('.').pop() ?? 'bin';
      const ruta = `${terapeutaId}/${crypto.randomUUID()}.${ext}`;

      const { error: errSubida } = await supabase.storage
        .from('recursos')
        .upload(ruta, file, { contentType: file.type, upsert: false });

      if (errSubida) {
        setError(`No se pudo subir "${file.name}".`);
        continue;
      }

      nuevos.push({
        tipo: 'archivo',
        titulo: file.name,
        ruta,
        mime: file.type,
        tamano: file.size,
      });
    }

    if (nuevos.length) onChange([...materiales, ...nuevos]);
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const agregarEnlace = () => {
    const url = nuevoEnlace.url.trim();
    if (!url) return;
    const conProtocolo = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    onChange([
      ...materiales,
      {
        tipo: 'enlace',
        titulo: nuevoEnlace.titulo.trim() || conProtocolo,
        url: conProtocolo,
      },
    ]);
    setNuevoEnlace({ titulo: '', url: '' });
  };

  const quitar = async (i: number) => {
    const m = materiales[i];
    // Si es archivo, lo borramos también del almacenamiento.
    if (m?.tipo === 'archivo' && m.ruta) {
      await supabase.storage.from('recursos').remove([m.ruta]);
    }
    onChange(materiales.filter((_, idx) => idx !== i));
  };

  return (
    <div className="rounded-xl border border-noema-deep/10 bg-bone/40 p-3">
      <p className="mb-2 text-sm font-medium text-ink">
        Materiales para el paciente
      </p>
      <p className="mb-3 text-xs text-foreground-muted">
        Lecturas, PDF, audios, imágenes o enlaces. Se los podrás pasar junto con la
        tarea. Máximo {MAX_MB} MB por archivo.
      </p>

      {/* Lista de materiales */}
      {materiales.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {materiales.map((m, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 rounded-lg border border-noema-deep/10 bg-white px-3 py-2"
            >
              <IconoMaterial material={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{m.titulo}</p>
                <p className="text-[11px] text-foreground-muted">
                  {m.tipo === 'enlace' ? m.url : formatoTamano(m.tamano)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label="Quitar material"
                className="shrink-0 text-foreground-muted hover:text-noema-clay"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Subir archivos */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACEPTA}
        onChange={(e) => e.target.files && subirArchivos(e.target.files)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-noema-deep/25 bg-white px-3 py-3 text-sm text-ink/70 hover:border-noema-sage hover:text-ink disabled:opacity-60"
      >
        <Upload className="size-4" strokeWidth={1.8} />
        {subiendo ? 'Subiendo…' : 'Subir archivo (PDF, audio, imagen, documento)'}
      </button>

      {/* Añadir enlace */}
      <div className="flex flex-wrap items-center gap-2">
        <Link2 className="size-4 shrink-0 text-noema-sage" strokeWidth={1.8} />
        <input
          value={nuevoEnlace.titulo}
          onChange={(e) => setNuevoEnlace((p) => ({ ...p, titulo: e.target.value }))}
          placeholder="Nombre del enlace"
          className="min-w-[8rem] flex-1 rounded-md border border-noema-deep/15 bg-white px-2.5 py-1.5 text-xs focus:border-noema-sage focus:outline-none"
        />
        <input
          value={nuevoEnlace.url}
          onChange={(e) => setNuevoEnlace((p) => ({ ...p, url: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              agregarEnlace();
            }
          }}
          placeholder="https://…"
          className="min-w-[10rem] flex-[2] rounded-md border border-noema-deep/15 bg-white px-2.5 py-1.5 text-xs focus:border-noema-sage focus:outline-none"
        />
        <button
          type="button"
          onClick={agregarEnlace}
          className="inline-flex items-center gap-1 rounded-md bg-noema-deep px-3 py-1.5 text-xs font-medium text-bone hover:bg-noema-deep/90"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Añadir
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function IconoMaterial({ material }: { material: Material }) {
  const cls = 'size-4 shrink-0 text-noema-sage';
  if (material.tipo === 'enlace') return <Link2 className={cls} strokeWidth={1.8} />;
  const mime = material.mime ?? '';
  if (mime.startsWith('audio/')) return <Music className={cls} strokeWidth={1.8} />;
  if (mime.startsWith('image/')) return <ImageIcon className={cls} strokeWidth={1.8} />;
  if (mime.includes('pdf') || mime.startsWith('text/'))
    return <FileText className={cls} strokeWidth={1.8} />;
  return <File className={cls} strokeWidth={1.8} />;
}

export function formatoTamano(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
