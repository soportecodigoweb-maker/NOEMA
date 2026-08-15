'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, CalendarCheck } from 'lucide-react';
import { reasignarPacienteCentroAction } from '../../../app/centro/actions';

interface Paciente {
  vinculacionId: string;
  nombre: string;
  estado: string;
  sesiones: number;
}

const ESTADO: Record<string, string> = {
  activa: 'bg-emotion-tranquilo/40 text-ink/70',
  pausada: 'bg-emotion-ansioso/30 text-ink/70',
  finalizada: 'bg-noema-deep/10 text-ink/50',
  pendiente: 'bg-emotion-cansado/30 text-ink/70',
};

export function PacientesTerapeuta({
  pacientes,
  otrosTerapeutas,
}: {
  pacientes: Paciente[];
  otrosTerapeutas: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [reasignando, setReasignando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reasignar = (vinculacionId: string, nuevoId: string) => {
    if (!nuevoId) return;
    setError(null);
    startTransition(async () => {
      const r = await reasignarPacienteCentroAction(vinculacionId, nuevoId);
      if (r.ok) {
        setReasignando(null);
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo reasignar.');
      }
    });
  };

  if (pacientes.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
        Este terapeuta no tiene pacientes.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {pacientes.map((p) => (
        <div
          key={p.vinculacionId}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-noema-deep/10 bg-white p-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-ink">{p.nombre}</p>
              <span className={`rounded px-2 py-0.5 text-[11px] ${ESTADO[p.estado] ?? ''}`}>{p.estado}</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted">
              <CalendarCheck className="size-3" /> {p.sesiones} sesión{p.sesiones === 1 ? '' : 'es'}
            </p>
          </div>

          {p.estado === 'activa' &&
            (reasignando === p.vinculacionId ? (
              <select
                autoFocus
                disabled={pending || otrosTerapeutas.length === 0}
                defaultValue=""
                onChange={(e) => reasignar(p.vinculacionId, e.target.value)}
                className="rounded-md border border-noema-deep/15 bg-white px-2 py-1.5 text-xs focus:border-noema-sage focus:outline-none"
              >
                <option value="" disabled>
                  Reasignar a…
                </option>
                {otrosTerapeutas.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setReasignando(p.vinculacionId)}
                disabled={otrosTerapeutas.length === 0}
                title={otrosTerapeutas.length === 0 ? 'Necesitas otro terapeuta en el centro' : 'Reasignar'}
                className="inline-flex items-center gap-1 rounded-md border border-noema-deep/15 px-2.5 py-1.5 text-xs text-ink hover:border-noema-deep/30 disabled:opacity-40"
              >
                <ArrowRightLeft className="size-3" /> Reasignar
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
