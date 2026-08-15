'use client';

import { useState, useTransition } from 'react';
import { MessageSquarePlus, Check } from 'lucide-react';
import { comentarPracticaAction } from '../../../app/centro/supervision-actions';

/** Observación del supervisor sobre la práctica clínica del terapeuta. */
export function ComentarPractica({ terapeutaId }: { terapeutaId: string }) {
  const [texto, setTexto] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  const guardar = () => {
    if (!texto.trim()) return;
    startTransition(async () => {
      const r = await comentarPracticaAction(terapeutaId, texto);
      if (r.ok) {
        setGuardado(true);
        setTexto('');
        setTimeout(() => setGuardado(false), 3000);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
        <MessageSquarePlus className="size-5 text-noema-sage" /> Observación de supervisión
      </h2>
      <p className="mb-3 text-sm text-foreground-muted">
        Deja una observación sobre la práctica clínica del terapeuta. Le llegará como aviso.
      </p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder="Tu observación para el terapeuta…"
        className="w-full rounded-md border border-noema-deep/15 px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={pending || !texto.trim()}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Guardando…' : 'Guardar observación'}
        </button>
        {guardado && (
          <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
            <Check className="size-4" /> Guardada
          </span>
        )}
      </div>
    </section>
  );
}
