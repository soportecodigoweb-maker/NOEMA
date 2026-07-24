'use client';

import { useState, useTransition } from 'react';
import { GraduationCap } from 'lucide-react';
import { toggleModoAprendizAction } from '../../../app/(auth)/aprendiz-actions';

/** Interruptor de modo aprendiz (tour guiado). */
export function ToggleAprendiz({ inicial }: { inicial: boolean }) {
  const [activo, setActivo] = useState(inicial);
  const [pending, startTransition] = useTransition();

  const cambiar = () => {
    const nuevo = !activo;
    setActivo(nuevo);
    startTransition(async () => {
      const r = await toggleModoAprendizAction(nuevo);
      if (!r.ok) setActivo(!nuevo);
      // Al reactivar, limpiamos lo "ya visto" para que el tour vuelva a aparecer.
      if (nuevo && typeof window !== 'undefined') {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith('guia-aprendiz:'))
          .forEach((k) => window.localStorage.removeItem(k));
      }
    });
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-noema-deep/10 bg-white p-4">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
        <GraduationCap className="size-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">Modo aprendiz</p>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Muestra una guía paso a paso en cada sección. Al reactivarlo, el tour vuelve a
          aparecer.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label="Modo aprendiz"
        disabled={pending}
        onClick={cambiar}
        className={`mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
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
