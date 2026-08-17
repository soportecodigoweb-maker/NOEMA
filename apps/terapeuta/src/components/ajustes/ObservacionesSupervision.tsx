import { MessageSquareQuote } from 'lucide-react';

export interface ObservacionSupervision {
  texto: string;
  fecha: string;
  centro: string;
}

/** Observaciones que el centro dejó al terapeuta tras supervisar su práctica. */
export function ObservacionesSupervision({ items }: { items: ObservacionSupervision[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-noema-deep/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
          <MessageSquareQuote className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Observaciones de supervisión</p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Lo que tu centro te ha compartido sobre tu práctica clínica.
          </p>
          <ul className="mt-3 space-y-2">
            {items.map((o, i) => (
              <li key={i} className="rounded-lg border border-noema-sage/20 bg-noema-sage/[0.04] p-3">
                <p className="whitespace-pre-wrap text-sm text-ink/85">{o.texto}</p>
                <p className="mt-1 text-[11px] text-foreground-muted">
                  {o.centro} · {o.fecha}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
