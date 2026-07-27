'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  establecerSonidosUI,
  sonidosUIActivos,
  sonarUI,
  establecerVolumenUI,
  volumenUI,
} from '@/lib/sonidos-ui';

/** Interruptor + volumen de los sonidos de interacción de la app. */
export function ToggleSonidosUI() {
  const [activo, setActivo] = useState(true);
  const [vol, setVol] = useState(100);

  // Sincronizamos con la preferencia guardada al montar (evita desajuste SSR).
  useEffect(() => {
    setActivo(sonidosUIActivos());
    setVol(Math.round(volumenUI() * 100));
  }, []);

  const cambiar = () => {
    const nuevo = !activo;
    setActivo(nuevo);
    establecerSonidosUI(nuevo);
    if (nuevo) sonarUI('toggleOn'); // pequeña muestra al encender
  };

  const cambiarVol = (v: number) => {
    setVol(v);
    establecerVolumenUI(v / 100);
    if (activo && v > 0) sonarUI('tap'); // muestra el nivel elegido
  };

  return (
    <div className="rounded-xl border border-noema-deep/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
          <Volume2 className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Sonidos de la app</p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Pequeños sonidos al tocar botones e interruptores.
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

      {activo && (
        <div className="mt-4 flex items-center gap-3 pl-12">
          <VolumeX className="size-4 shrink-0 text-foreground-muted" strokeWidth={1.8} />
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={vol}
            onChange={(e) => cambiarVol(Number(e.target.value))}
            aria-label="Volumen de los sonidos"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-noema-deep/15 accent-noema-sage"
          />
          <Volume2 className="size-4 shrink-0 text-noema-sage" strokeWidth={1.8} />
          <span className="w-9 shrink-0 text-right text-xs tabular-nums text-foreground-muted">
            {vol}%
          </span>
        </div>
      )}
    </div>
  );
}
