'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Estado de error reutilizable para los error.tsx de cada grupo de rutas.
 *
 * Recuperación automática: la causa más común de estos errores es un
 * despliegue nuevo mientras el usuario tenía la app abierta (el navegador pide
 * una "Server Action" que ya cambió). En ese caso una recarga completa lo
 * arregla. Aquí, la PRIMERA vez que falla una ruta, recargamos la página
 * automáticamente (una sola vez por sesión y ruta, para no entrar en bucle si
 * el error es real). Si tras recargar vuelve a fallar, mostramos el aviso.
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
  // Mientras decidimos si recargar, no mostramos nada (evita el parpadeo del
  // cartel antes de la recarga automática).
  const [recargando, setRecargando] = useState(true);

  useEffect(() => {
    let clave = 'noema:recarga-error';
    try {
      clave += ':' + window.location.pathname;
    } catch {
      /* noop */
    }

    // Guardamos CUÁNDO recargamos por última vez. Si el error vuelve enseguida
    // (<15 s) es un error real y mostramos el aviso; si pasó más tiempo, damos
    // otro intento automático.
    let recargaReciente = false;
    try {
      const t = Number(sessionStorage.getItem(clave) ?? 0);
      recargaReciente = t > 0 && Date.now() - t < 15000;
    } catch {
      /* almacenamiento no disponible */
    }

    if (!recargaReciente) {
      try {
        sessionStorage.setItem(clave, String(Date.now()));
      } catch {
        /* noop */
      }
      window.location.reload();
      return;
    }

    setRecargando(false);
  }, []);

  if (recargando) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-20 text-center">
        <RotateCw className="size-6 animate-spin text-noema-sage" strokeWidth={1.8} />
        <p className="mt-3 text-sm text-foreground-muted">Actualizando…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-noema-clay/15">
        <AlertTriangle className="size-7 text-noema-clay" strokeWidth={1.7} />
      </div>
      <h2 className="font-serif text-2xl text-ink">{titulo}</h2>
      <p className="mt-2 text-sm text-foreground-muted">{detalle}</p>
      <button
        onClick={() => {
          try {
            window.location.reload();
          } catch {
            reset();
          }
        }}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
      >
        <RotateCw className="size-4" strokeWidth={1.9} />
        Reintentar
      </button>
    </div>
  );
}
