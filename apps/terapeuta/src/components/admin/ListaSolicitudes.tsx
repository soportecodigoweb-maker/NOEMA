'use client';

import { useState, useTransition } from 'react';
import { cambiarEstadoSolicitudAction } from '../../../app/admin/solicitudes-actions';

interface Solicitud {
  id: string;
  tipo: string;
  asunto: string | null;
  mensaje: string;
  estado: string;
  usuario: string;
  rol: string | null;
  fecha: string;
}

const ESTADOS: { key: 'abierta' | 'en_proceso' | 'resuelta'; label: string }[] = [
  { key: 'abierta', label: 'Abierta' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'resuelta', label: 'Resuelta' },
];

const COLOR: Record<string, string> = {
  abierta: 'bg-noema-clay/15 text-noema-clay',
  en_proceso: 'bg-emotion-cansado/30 text-ink/70',
  resuelta: 'bg-noema-sage/15 text-noema-sage',
};

const TIPO_LABEL: Record<string, string> = {
  soporte: 'Soporte técnico',
  duda: 'Duda',
  sugerencia: 'Sugerencia',
  observacion: 'Observación',
};

export function ListaSolicitudes({ inicial }: { inicial: Solicitud[] }) {
  const [items, setItems] = useState(inicial);
  const [, startTransition] = useTransition();

  const cambiar = (id: string, estado: 'abierta' | 'en_proceso' | 'resuelta') => {
    setItems((p) => p.map((s) => (s.id === id ? { ...s, estado } : s)));
    startTransition(() => {
      cambiarEstadoSolicitudAction(id, estado);
    });
  };

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-6 text-sm text-foreground-muted">
        No hay solicitudes por ahora.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s.id} className="rounded-2xl border border-noema-deep/10 bg-white p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded bg-noema-deep/[0.06] px-2 py-0.5 text-[11px] text-ink/70">
              {TIPO_LABEL[s.tipo] ?? s.tipo}
            </span>
            <span className={`rounded px-2 py-0.5 text-[11px] ${COLOR[s.estado] ?? ''}`}>
              {ESTADOS.find((e) => e.key === s.estado)?.label ?? s.estado}
            </span>
            <span className="text-xs text-foreground-muted">
              {s.usuario}{s.rol ? ` · ${s.rol}` : ''} · {s.fecha}
            </span>
          </div>
          {s.asunto && <p className="text-sm font-medium text-ink">{s.asunto}</p>}
          <p className="whitespace-pre-wrap text-sm text-ink/80">{s.mensaje}</p>
          <div className="mt-3 flex gap-1.5">
            {ESTADOS.map((e) => (
              <button
                key={e.key}
                onClick={() => cambiar(s.id, e.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  s.estado === e.key
                    ? 'bg-noema-deep text-bone'
                    : 'border border-noema-deep/15 text-ink/70 hover:border-noema-deep/30'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
