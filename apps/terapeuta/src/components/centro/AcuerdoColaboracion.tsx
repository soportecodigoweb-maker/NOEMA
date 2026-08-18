'use client';

import { useState, useTransition } from 'react';
import { FileSignature, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { guardarAcuerdoCentroAction } from '../../../app/centro/supervision-actions';

/** El centro edita el acuerdo de colaboración que aceptan sus terapeutas. */
export function AcuerdoColaboracion({ inicial }: { inicial: string }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(inicial);
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  const guardar = () => {
    startTransition(async () => {
      const r = await guardarAcuerdoCentroAction(texto);
      if (r.ok) {
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2500);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <button
        onClick={() => setAbierto((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 font-serif text-lg text-ink">
            <FileSignature className="size-5 text-noema-sage" /> Acuerdo de colaboración
          </span>
          <span className="mt-0.5 block text-sm text-foreground-muted">
            Lo que cada terapeuta acepta al unirse a tu centro. Puedes editarlo.
          </span>
        </span>
        {abierto ? (
          <ChevronUp className="size-5 shrink-0 text-foreground-muted" />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-foreground-muted" />
        )}
      </button>

      {abierto && (
        <div className="mt-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={12}
            className="w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm leading-relaxed focus:border-noema-sage focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={guardar}
              disabled={pending || !texto.trim()}
              className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
            >
              {pending ? 'Guardando…' : 'Guardar acuerdo'}
            </button>
            {guardado && (
              <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
                <Check className="size-4" /> Guardado
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
