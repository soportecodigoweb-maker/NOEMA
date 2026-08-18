'use client';

import { useState, useTransition } from 'react';
import { MessageSquareQuote, Check } from 'lucide-react';
import { marcarObservacionVistaAction } from '../../../app/(panel)/ajustes/obs-actions';

export interface ObservacionSupervision {
  id: string;
  texto: string;
  fecha: string;
  centro: string;
  visto: boolean;
}

/** Observaciones que el centro dejó al terapeuta tras supervisar su práctica. */
export function ObservacionesSupervision({ items }: { items: ObservacionSupervision[] }) {
  const [obs, setObs] = useState(items);
  const [, startTransition] = useTransition();

  if (obs.length === 0) return null;

  const marcar = (id: string) => {
    setObs((prev) => prev.map((o) => (o.id === id ? { ...o, visto: true } : o)));
    startTransition(() => {
      marcarObservacionVistaAction(id);
    });
  };

  const pendientes = obs.filter((o) => !o.visto).length;

  return (
    <div className="rounded-xl border border-noema-deep/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
          <MessageSquareQuote className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            Observaciones de supervisión
            {pendientes > 0 && (
              <span className="ml-2 rounded-full bg-noema-clay/15 px-2 py-0.5 text-[11px] text-noema-clay">
                {pendientes} sin leer
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Lo que tu centro te ha compartido sobre tu práctica clínica.
          </p>
          <ul className="mt-3 space-y-2">
            {obs.map((o) => (
              <li
                key={o.id}
                className={`rounded-lg border p-3 ${
                  o.visto
                    ? 'border-noema-deep/10 bg-white'
                    : 'border-noema-sage/30 bg-noema-sage/[0.06]'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm text-ink/85">{o.texto}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-foreground-muted">
                    {o.centro} · {o.fecha}
                  </p>
                  {o.visto ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-noema-sage">
                      <Check className="size-3" /> Leída
                    </span>
                  ) : (
                    <button
                      onClick={() => marcar(o.id)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-noema-deep px-2.5 py-1 text-[11px] font-medium text-bone hover:bg-noema-deep/90"
                    >
                      <Check className="size-3" /> Listo, la leí
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
