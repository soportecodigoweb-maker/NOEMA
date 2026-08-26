'use client';

import { useState, useTransition } from 'react';
import { Lock, Plus, Trash2, Check, Save } from 'lucide-react';
import { crearNotaAction, actualizarNotaAction, eliminarNotaAction } from './actions';

interface Nota {
  id: string;
  titulo: string | null;
  contenido: string;
  actualizado_at: string;
}

export function NotasLista({
  vinculacionId,
  iniciales,
}: {
  vinculacionId: string;
  iniciales: Nota[];
}) {
  const [notas, setNotas] = useState<Nota[]>(iniciales);

  // Composer de nota nueva.
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [creando, startCrear] = useTransition();
  const [errorNueva, setErrorNueva] = useState<string | null>(null);

  const crear = () => {
    if (!nuevoContenido.trim() && !nuevoTitulo.trim()) {
      setErrorNueva('Escribe algo antes de guardar.');
      return;
    }
    setErrorNueva(null);
    startCrear(async () => {
      const r = await crearNotaAction(vinculacionId, nuevoTitulo, nuevoContenido);
      if (r.ok && r.id) {
        setNotas((prev) => [
          {
            id: r.id!,
            titulo: nuevoTitulo.trim() || null,
            contenido: nuevoContenido,
            actualizado_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setNuevoTitulo('');
        setNuevoContenido('');
      } else {
        setErrorNueva('No se pudo guardar la nota. Intenta de nuevo.');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Nueva nota ── */}
      <div className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.04] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Plus className="size-4 text-noema-sage" strokeWidth={2} />
          <h3 className="text-sm font-medium text-ink">Nueva nota</h3>
        </div>
        <input
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          placeholder="Título (ej. Sesión 3 · 30 jul) — opcional"
          className="mb-2 w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-noema-sage focus:outline-none"
        />
        <textarea
          value={nuevoContenido}
          onChange={(e) => setNuevoContenido(e.target.value)}
          placeholder="Observaciones clínicas, hipótesis, decisiones, contexto familiar, alertas…"
          className="min-h-[120px] w-full resize-y rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm leading-relaxed text-ink focus:border-noema-sage focus:outline-none"
        />
        {errorNueva && <p className="mt-1 text-sm text-red-600">{errorNueva}</p>}
        <button
          onClick={crear}
          disabled={creando}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          <Save className="size-4" /> {creando ? 'Guardando…' : 'Guardar nota'}
        </button>
      </div>

      {/* ── Notas guardadas ── */}
      {notas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
          Aún no tienes notas. Crea la primera arriba — por ejemplo, una por cada sesión.
        </div>
      ) : (
        notas.map((n) => (
          <NotaEditable
            key={n.id}
            nota={n}
            vinculacionId={vinculacionId}
            onBorrar={(id) => setNotas((prev) => prev.filter((x) => x.id !== id))}
            onGuardado={(id, titulo, contenido) =>
              setNotas((prev) =>
                prev.map((x) => (x.id === id ? { ...x, titulo, contenido } : x)),
              )
            }
          />
        ))
      )}

      <p className="flex items-center gap-1 text-xs text-foreground-muted">
        <Lock className="size-3" /> Privadas: solo tú las ves. Toca «Guardar» para conservar tus
        cambios.
      </p>
    </div>
  );
}

/** Una nota existente, editable, con botón de guardar explícito. */
function NotaEditable({
  nota,
  vinculacionId,
  onBorrar,
  onGuardado,
}: {
  nota: Nota;
  vinculacionId: string;
  onBorrar: (id: string) => void;
  onGuardado: (id: string, titulo: string | null, contenido: string) => void;
}) {
  const [titulo, setTitulo] = useState(nota.titulo ?? '');
  const [contenido, setContenido] = useState(nota.contenido);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sucio = titulo !== (nota.titulo ?? '') || contenido !== nota.contenido;

  const guardar = () => {
    setError(null);
    startTransition(async () => {
      const r = await actualizarNotaAction(nota.id, titulo, contenido);
      if (r.ok) {
        onGuardado(nota.id, titulo.trim() || null, contenido);
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2500);
      } else {
        setError('No se pudo guardar. Intenta de nuevo.');
      }
    });
  };

  const borrar = () => {
    onBorrar(nota.id);
    startTransition(() => {
      eliminarNotaAction(nota.id, vinculacionId);
    });
  };

  return (
    <div className="rounded-2xl border border-noema-deep/10 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título — opcional"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink placeholder:text-ink/35 focus:outline-none"
        />
        <button
          onClick={borrar}
          aria-label="Eliminar nota"
          className="shrink-0 text-ink/30 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Observaciones clínicas…"
        className="min-h-[140px] w-full resize-y rounded-lg border border-noema-deep/10 bg-bone/20 px-3 py-2 text-sm leading-relaxed text-ink focus:border-noema-sage focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={pending || !sucio}
          className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          <Save className="size-4" /> {pending ? 'Guardando…' : sucio ? 'Guardar cambios' : 'Guardado'}
        </button>
        {guardado && (
          <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
            <Check className="size-4" /> Guardado
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
