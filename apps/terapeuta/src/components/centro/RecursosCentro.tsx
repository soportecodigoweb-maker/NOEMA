'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
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
}

const TIPOS = ['documento', 'protocolo', 'formato', 'capacitacion', 'video', 'enlace', 'otro'];
const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function RecursosCentro({ inicial }: { inicial: Recurso[] }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('documento');
  const [url, setUrl] = useState('');
  const [nota, setNota] = useState('');
  const [, startTransition] = useTransition();

  const agregar = () => {
    if (!titulo.trim()) return;
    startTransition(async () => {
      await agregarRecursoCentroAction(titulo, tipo, url, nota);
      setTitulo('');
      setUrl('');
      setNota('');
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
        <button
          onClick={agregar}
          disabled={!titulo.trim()}
          className="mt-3 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          Publicar recurso
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
                  <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-xs text-noema-sage hover:underline">
                    {r.url}
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
