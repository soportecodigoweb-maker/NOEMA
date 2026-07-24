'use client';

import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { establecerSonidosUI, sonidosUIActivos, sonarUI } from '@/lib/sonidos-ui';

/** Interruptor de sonidos de interacción de la app. */
export function ToggleSonidosUI() {
  const [activo, setActivo] = useState(true);

  // Sincronizamos con la preferencia guardada al montar (evita desajuste SSR).
  useEffect(() => {
    setActivo(sonidosUIActivos());
  }, []);

  const cambiar = () => {
    const nuevo = !activo;
    setActivo(nuevo);
    establecerSonidosUI(nuevo);
    if (nuevo) sonarUI('toggleOn'); // pequeña muestra al encender
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-noema-deep/10 bg-white p-4">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
        <Volume2 className="size-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">Sonidos de la app</p>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Pequeños sonidos al tocar botones, escribir y usar la app. Discretos y suaves.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label="Sonidos de la app"
        onClick={cambiar}
        className={`mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          activo ? 'bg-noema-sage' : 'bg-noema-deep/20'
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-white shadow transition-transform ${
            activo ? '[transform:translateX(1.375rem)]' : '[transform:translateX(0.125rem)]'
          }`}
        />
      </button>
    </div>
  );
}
