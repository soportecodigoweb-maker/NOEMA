'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

interface Adjunto {
  id: string;
  ruta: string;
  nombre: string;
  tipo_mime: string | null;
  creado_at: string;
}

export function AdjuntosExpediente({
  vinculacionId,
  iniciales,
}: {
  vinculacionId: string;
  iniciales: Adjunto[];
}) {
  const router = useRouter();
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>(iniciales);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient();

  const subir = async (file: File) => {
    setError(null);
    setSubiendo(true);
    try {
      const ext = file.name.split('.').pop() ?? 'bin';
      const ruta = `${vinculacionId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('adjuntos')
        .upload(ruta, file, { contentType: file.type });
      if (upErr) throw upErr;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: row, error: insErr } = await supabase
        .from('adjuntos')
        .insert({
          vinculacion_id: vinculacionId,
          subido_por: user!.id,
          ruta,
          nombre: file.name,
          tipo_mime: file.type,
          tamano_bytes: file.size,
        })
        .select('id, ruta, nombre, tipo_mime, creado_at')
        .single();
      if (insErr) throw insErr;

      setAdjuntos((prev) => [row as Adjunto, ...prev]);
      router.refresh();
    } catch {
      setError('No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
    }
  };

  const abrir = async (ruta: string) => {
    const { data } = await supabase.storage
      .from('adjuntos')
      .createSignedUrl(ruta, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-medium text-ink">
          <Paperclip className="size-4 text-noema-sage" strokeWidth={1.7} />
          Adjuntos del expediente
        </h3>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="inline-flex items-center gap-1.5 rounded-md border border-noema-deep/15 bg-bone px-3 py-1.5 text-xs font-medium text-ink hover:border-noema-sage disabled:opacity-50"
        >
          <Upload className="size-3.5" strokeWidth={1.8} />
          {subiendo ? 'Subiendo…' : 'Subir archivo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subir(f);
            e.target.value = '';
          }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {adjuntos.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          Sin adjuntos. Sube imágenes o PDFs (formatos escaneados, etc.).
        </p>
      ) : (
        <ul className="space-y-1.5">
          {adjuntos.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => abrir(a.ruta)}
                className="flex w-full items-center gap-3 rounded-md border border-noema-deep/10 bg-white px-3 py-2 text-left text-sm hover:border-noema-sage"
              >
                {a.tipo_mime?.startsWith('image/') ? (
                  <ImageIcon className="size-4 shrink-0 text-noema-sage" strokeWidth={1.7} />
                ) : (
                  <FileText className="size-4 shrink-0 text-noema-sage" strokeWidth={1.7} />
                )}
                <span className="min-w-0 flex-1 truncate text-ink/80">{a.nombre}</span>
                <span className="text-xs text-foreground-muted">
                  {new Date(a.creado_at).toLocaleDateString('es-MX')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-foreground-muted">
        Los adjuntos forman parte del expediente y no se eliminan.
      </p>
    </div>
  );
}
