'use client';

import { useState } from 'react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Download, ExternalLink } from 'lucide-react';
import { IconoMaterial, formatoTamano, type Material } from './EditorMateriales';

/**
 * Muestra los materiales de un recurso o tarea y permite abrirlos.
 * Los archivos del bucket privado se abren con una URL firmada temporal
 * (la RLS ya garantiza que solo el terapeuta dueño y su paciente vinculado
 * pueden leerlos).
 */
export function ListaMateriales({
  materiales,
  titulo = 'Materiales',
}: {
  materiales: Material[];
  titulo?: string;
}) {
  const [abriendo, setAbriendo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  if (!materiales || materiales.length === 0) return null;

  const abrir = async (m: Material, i: number) => {
    setError(null);
    if (m.tipo === 'enlace' && m.url) {
      window.open(m.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!m.ruta) return;

    setAbriendo(i);
    // URL firmada válida 1 hora.
    const { data, error: err } = await supabase.storage
      .from('recursos')
      .createSignedUrl(m.ruta, 3600);
    setAbriendo(null);

    if (err || !data?.signedUrl) {
      setError('No se pudo abrir el archivo.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-6 border-t border-noema-deep/8 pt-5">
      <h3 className="caption mb-3">{titulo}</h3>
      <ul className="space-y-1.5">
        {materiales.map((m, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => abrir(m, i)}
              disabled={abriendo === i}
              className="flex w-full items-center gap-2.5 rounded-lg border border-noema-deep/10 bg-bone/40 px-3 py-2.5 text-left transition-colors hover:border-noema-sage hover:bg-white disabled:opacity-60"
            >
              <IconoMaterial material={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{m.titulo}</p>
                <p className="text-[11px] text-foreground-muted">
                  {m.tipo === 'enlace' ? m.url : formatoTamano(m.tamano)}
                </p>
              </div>
              {m.tipo === 'enlace' ? (
                <ExternalLink className="size-4 shrink-0 text-foreground-muted" strokeWidth={1.7} />
              ) : (
                <Download className="size-4 shrink-0 text-foreground-muted" strokeWidth={1.7} />
              )}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
