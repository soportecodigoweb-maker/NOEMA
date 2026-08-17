'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PauseCircle, PlayCircle, UserMinus } from 'lucide-react';
import { gestionarTerapeutaCentroAction } from '../../../app/centro/supervision-actions';

export function GestionTerapeuta({ terapeutaId, estado }: { terapeutaId: string; estado: string }) {
  const router = useRouter();
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accionar = (accion: 'suspender' | 'reactivar' | 'eliminar') => {
    setError(null);
    startTransition(async () => {
      const r = await gestionarTerapeutaCentroAction(terapeutaId, accion);
      if (r.ok) {
        if (accion === 'eliminar') {
          router.push('/centro/terapeutas');
        }
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo completar la acción.');
        setConfirmarEliminar(false);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && <p className="w-full text-right text-xs text-[#B85450]">{error}</p>}
      {estado === 'activa' ? (
        <button
          onClick={() => accionar('suspender')}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-noema-deep/15 px-3 py-2 text-sm text-ink hover:border-noema-deep/30 disabled:opacity-40"
        >
          <PauseCircle className="size-4" /> Suspender
        </button>
      ) : (
        <button
          onClick={() => accionar('reactivar')}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-noema-sage/40 px-3 py-2 text-sm text-noema-sage hover:bg-noema-sage/10 disabled:opacity-40"
        >
          <PlayCircle className="size-4" /> Reactivar
        </button>
      )}

      {!confirmarEliminar ? (
        <button
          onClick={() => setConfirmarEliminar(true)}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[#B85450] hover:bg-[#B85450]/8"
        >
          <UserMinus className="size-4" /> Eliminar del centro
        </button>
      ) : (
        <div className="inline-flex items-center gap-2">
          <span className="text-sm text-foreground-muted">¿Seguro?</span>
          <button
            onClick={() => accionar('eliminar')}
            disabled={pending}
            className="rounded-md bg-[#B85450] px-3 py-2 text-sm font-medium text-white hover:bg-[#A14642] disabled:opacity-50"
          >
            {pending ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
          <button
            onClick={() => setConfirmarEliminar(false)}
            className="text-sm text-foreground-muted hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
