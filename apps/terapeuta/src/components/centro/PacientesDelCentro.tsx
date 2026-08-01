'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRightLeft } from 'lucide-react';
import { reasignarPacienteCentroAction } from '../../../app/centro/actions';

interface Terapeuta {
  terapeutaId: string;
  nombre: string;
  pacientes: { vinculacionId: string; nombre: string }[];
}

export function PacientesDelCentro({ terapeutas }: { terapeutas: Terapeuta[] }) {
  const router = useRouter();
  const [reasignando, setReasignando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const opciones = terapeutas.map((t) => ({ id: t.terapeutaId, nombre: t.nombre }));

  const reasignar = (vinculacionId: string, nuevoTerapeutaId: string) => {
    if (!nuevoTerapeutaId) return;
    setError(null);
    startTransition(async () => {
      const r = await reasignarPacienteCentroAction(vinculacionId, nuevoTerapeutaId);
      if (r.ok) {
        setReasignando(null);
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo reasignar.');
      }
    });
  };

  if (terapeutas.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Aún no hay terapeutas vinculados. Comparte el código de arriba para que se unan.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {terapeutas.map((t) => (
        <div key={t.terapeutaId}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Users className="size-4 text-noema-sage" /> {t.nombre}
            <span className="text-xs font-normal text-foreground-muted">
              · {t.pacientes.length} paciente{t.pacientes.length === 1 ? '' : 's'}
            </span>
          </h3>
          {t.pacientes.length === 0 ? (
            <p className="pl-6 text-xs text-foreground-muted">Sin pacientes activos.</p>
          ) : (
            <ul className="space-y-1.5">
              {t.pacientes.map((p) => (
                <li
                  key={p.vinculacionId}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-noema-deep/10 bg-white px-3 py-2"
                >
                  <span className="flex-1 text-sm text-ink">{p.nombre}</span>
                  {reasignando === p.vinculacionId ? (
                    <select
                      autoFocus
                      disabled={pending}
                      defaultValue=""
                      onChange={(e) => reasignar(p.vinculacionId, e.target.value)}
                      className="rounded-md border border-noema-deep/15 bg-white px-2 py-1 text-xs focus:border-noema-sage focus:outline-none"
                    >
                      <option value="" disabled>
                        Reasignar a…
                      </option>
                      {opciones
                        .filter((o) => o.id !== t.terapeutaId)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.nombre}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setReasignando(p.vinculacionId)}
                      disabled={opciones.length < 2}
                      className="inline-flex items-center gap-1 rounded-md border border-noema-deep/15 px-2 py-1 text-xs text-ink hover:border-noema-deep/30 disabled:opacity-40"
                      title={opciones.length < 2 ? 'Necesitas otro terapeuta en el centro' : 'Reasignar'}
                    >
                      <ArrowRightLeft className="size-3" /> Reasignar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
