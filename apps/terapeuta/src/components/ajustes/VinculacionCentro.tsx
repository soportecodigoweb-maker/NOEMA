'use client';

import { useState, useTransition } from 'react';
import { Building2, Check } from 'lucide-react';
import { vincularseCentroAction, salirCentroAction } from '../../../app/(panel)/ajustes/centro-actions';

export function VinculacionCentro({ centroActual }: { centroActual: string | null }) {
  const [centro, setCentro] = useState<string | null>(centroActual);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const vincular = () => {
    setError(null);
    startTransition(async () => {
      const r = await vincularseCentroAction(codigo);
      if (r.ok) {
        setCentro(r.centro ?? 'tu centro');
        setCodigo('');
      } else {
        setError(r.error ?? 'No se pudo vincular.');
      }
    });
  };

  const salir = () => {
    startTransition(async () => {
      const r = await salirCentroAction();
      if (r.ok) setCentro(null);
    });
  };

  return (
    <div className="rounded-xl border border-noema-deep/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
          <Building2 className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Centro terapéutico</p>
          {centro ? (
            <>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-noema-sage">
                <Check className="size-3" /> Perteneces a {centro}
              </p>
              <div>
                <button
                  onClick={salir}
                  disabled={pending}
                  className="mt-2 text-xs font-medium text-[#B85450] hover:underline disabled:opacity-50"
                >
                  Salir del centro
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-xs text-foreground-muted">
                Si trabajas en un centro, vincúlate con su código para que el encargado pueda
                dar continuidad a tus pacientes.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="CENTRO-XXXXX"
                  className="w-44 rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm uppercase focus:border-noema-sage focus:outline-none"
                />
                <button
                  onClick={vincular}
                  disabled={pending || !codigo.trim()}
                  className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                >
                  {pending ? 'Vinculando…' : 'Vincularme'}
                </button>
              </div>
              {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
