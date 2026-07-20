'use client';

import { useState, useTransition } from 'react';
import { crearMetaAction, toggleMetaAction, eliminarMetaAction } from '../../../app/paciente/actions';

interface Meta {
  id: string;
  titulo: string;
  completado: boolean;
}

export function MetasClient({ iniciales }: { iniciales: Meta[] }) {
  const [metas, setMetas] = useState<Meta[]>(iniciales);
  const [titulo, setTitulo] = useState('');
  const [pending, startTransition] = useTransition();

  const total = metas.length;
  const hechas = metas.filter((m) => m.completado).length;
  const pct = total > 0 ? Math.round((hechas / total) * 100) : 0;

  const crear = () => {
    const t = titulo.trim();
    if (!t) return;
    setTitulo('');
    startTransition(async () => {
      const res = await crearMetaAction(t);
      if (res.ok) {
        setMetas((prev) => [{ id: crypto.randomUUID(), titulo: t, completado: false }, ...prev]);
      }
    });
  };

  const toggle = (m: Meta) => {
    const nuevo = !m.completado;
    setMetas((prev) => prev.map((x) => (x.id === m.id ? { ...x, completado: nuevo } : x)));
    startTransition(() => {
      toggleMetaAction(m.id, nuevo);
    });
  };

  const eliminar = (id: string) => {
    setMetas((prev) => prev.filter((x) => x.id !== id));
    startTransition(() => {
      eliminarMetaAction(id);
    });
  };

  return (
    <div className="space-y-5">
      {total > 0 && (
        <div className="rounded-2xl bg-noema-sage/8 p-5">
          <p className="text-xs uppercase tracking-wider text-ink/50">Tu progreso</p>
          <p className="mt-1 font-serif text-2xl text-ink">
            {hechas}/{total} <span className="text-sm text-ink/50">completadas ({pct}%)</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
            <div className="h-2 rounded-full bg-noema-sage" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && crear()}
          placeholder="Ej. Caminar 10 min, llamar a mi hermana…"
          className="flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
        />
        <button
          onClick={crear}
          disabled={pending || !titulo.trim()}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      {metas.length === 0 ? (
        <p className="text-sm text-ink/50">Aún no tienes metas. Crea la primera arriba.</p>
      ) : (
        <ul className="space-y-2">
          {metas.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3"
            >
              <button
                onClick={() => toggle(m)}
                aria-label={m.completado ? 'Marcar como pendiente' : 'Marcar como completada'}
                className={`flex size-6 items-center justify-center rounded border-2 ${
                  m.completado ? 'border-noema-sage bg-noema-sage text-bone' : 'border-ink/25'
                }`}
              >
                {m.completado && '✓'}
              </button>
              <span className={`flex-1 text-sm ${m.completado ? 'text-ink/40 line-through' : 'text-ink'}`}>
                {m.titulo}
              </span>
              <button onClick={() => eliminar(m.id)} aria-label="Eliminar" className="text-red-500 hover:text-red-700">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
