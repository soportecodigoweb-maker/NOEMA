'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Lock, Plus, Trash2, Check } from 'lucide-react';
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
  const [estado, setEstado] = useState<Record<string, 'guardando' | 'guardado' | undefined>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Lo que aún no se ha guardado, por si el terapeuta sale de la página.
  const pendientes = useRef<Record<string, { titulo: string; contenido: string }>>({});
  const [, startTransition] = useTransition();

  /** Guarda YA lo pendiente de una nota (o de todas). */
  const guardarAhora = (id?: string) => {
    const ids = id ? [id] : Object.keys(pendientes.current);
    for (const k of ids) {
      const p = pendientes.current[k];
      if (!p) continue;
      if (timers.current[k]) clearTimeout(timers.current[k]);
      delete pendientes.current[k];
      void actualizarNotaAction(k, p.titulo, p.contenido).then(() => {
        setEstado((s) => ({ ...s, [k]: 'guardado' }));
        setTimeout(() => setEstado((s) => ({ ...s, [k]: undefined })), 1500);
      });
    }
  };

  // Red de seguridad: guardar al salir de la página, cambiar de pestaña o
  // desmontar el componente (antes se perdía lo escrito en los últimos 800 ms).
  useEffect(() => {
    const alOcultar = () => {
      if (document.visibilityState === 'hidden') guardarAhora();
    };
    window.addEventListener('beforeunload', () => guardarAhora());
    document.addEventListener('visibilitychange', alOcultar);
    return () => {
      document.removeEventListener('visibilitychange', alOcultar);
      guardarAhora();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const programarGuardado = (id: string, titulo: string, contenido: string) => {
    setEstado((s) => ({ ...s, [id]: 'guardando' }));
    pendientes.current[id] = { titulo, contenido };
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => guardarAhora(id), 700);
  };

  const editar = (id: string, campo: 'titulo' | 'contenido', valor: string) => {
    let titulo = '';
    let contenido = '';
    setNotas((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const actualizada = { ...n, [campo]: valor };
        titulo = actualizada.titulo ?? '';
        contenido = actualizada.contenido;
        return actualizada;
      }),
    );
    programarGuardado(id, titulo, contenido);
  };

  const nueva = () => {
    startTransition(async () => {
      const r = await crearNotaAction(vinculacionId, '', '');
      if (r.ok && r.id) {
        setNotas((prev) => [
          { id: r.id!, titulo: '', contenido: '', actualizado_at: new Date().toISOString() },
          ...prev,
        ]);
      }
    });
  };

  const borrar = (id: string) => {
    setNotas((prev) => prev.filter((n) => n.id !== id));
    startTransition(() => {
      eliminarNotaAction(id, vinculacionId);
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={nueva}
        className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
      >
        <Plus className="size-4" strokeWidth={1.9} /> Crear una nueva nota
      </button>

      {notas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
          Aún no tienes notas. Crea una — por ejemplo, una por cada sesión.
        </div>
      ) : (
        notas.map((n) => (
          <div key={n.id} className="rounded-2xl border border-noema-deep/10 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={n.titulo ?? ''}
                onChange={(e) => editar(n.id, 'titulo', e.target.value)}
                onBlur={() => guardarAhora(n.id)}
                placeholder="Título (ej. Sesión 3 · 30 jul)"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink placeholder:text-ink/35 focus:outline-none"
              />
              {estado[n.id] === 'guardando' && (
                <span className="shrink-0 text-[11px] text-ink/40">Guardando…</span>
              )}
              {estado[n.id] === 'guardado' && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-noema-sage">
                  <Check className="size-3" /> Guardado
                </span>
              )}
              <button
                onClick={() => borrar(n.id)}
                aria-label="Eliminar nota"
                className="shrink-0 text-ink/30 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <textarea
              value={n.contenido}
              onChange={(e) => editar(n.id, 'contenido', e.target.value)}
              onBlur={() => guardarAhora(n.id)}
              placeholder="Observaciones clínicas, hipótesis, decisiones, contexto familiar, alertas…"
              className="min-h-[140px] w-full resize-y rounded-lg border border-noema-deep/10 bg-bone/20 px-3 py-2 text-sm leading-relaxed text-ink/85 focus:border-noema-sage focus:outline-none"
            />
          </div>
        ))
      )}

      <p className="flex items-center gap-1 text-xs text-foreground-muted">
        <Lock className="size-3" /> Se guardan solas mientras escribes y al salir del campo.
      </p>
    </div>
  );
}
