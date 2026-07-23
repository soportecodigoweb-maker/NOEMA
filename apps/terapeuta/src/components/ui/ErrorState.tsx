'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Estado de error reutilizable para los error.tsx de cada grupo de rutas.
 * Evita que un fallo en una consulta tumbe toda la app: muestra un mensaje
 * amable con opción de reintentar.
 */
export function ErrorState({
  reset,
  titulo = 'Algo no cargó bien',
  detalle = 'Hubo un problema al mostrar esta sección. Puedes reintentar.',
}: {
  reset: () => void;
  titulo?: string;
  detalle?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-noema-clay/15">
        <AlertTriangle className="size-7 text-noema-clay" strokeWidth={1.7} />
      </div>
      <h2 className="font-serif text-2xl text-ink">{titulo}</h2>
      <p className="mt-2 text-sm text-foreground-muted">{detalle}</p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
      >
        <RotateCw className="size-4" strokeWidth={1.9} />
        Reintentar
      </button>
    </div>
  );
}
