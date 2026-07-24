'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, X } from 'lucide-react';

/**
 * Botón de apoyo escondido como pestaña lateral (R6-2).
 * En reposo se ve solo una pestaña delgada, apenas visible, sobre el borde
 * derecho a media pantalla, con las letras "S.O.S". Al tocarla se despliega el
 * botón completo "Necesito apoyo" que lleva a la pantalla de crisis.
 */
export function SosTab() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="fixed right-0 top-1/2 z-50 -translate-y-1/2">
      {/* Pestaña delgada (colapsada) */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir botón de apoyo"
          className="flex flex-col items-center gap-1 rounded-l-lg bg-noema-sage/70 py-3 pl-1.5 pr-1 text-bone/90 shadow-md backdrop-blur-sm transition-colors hover:bg-noema-sage"
        >
          <LifeBuoy className="size-3.5" strokeWidth={2} />
          <span className="text-[10px] font-bold leading-none [writing-mode:vertical-rl]">
            S.O.S
          </span>
        </button>
      )}

      {/* Panel desplegado */}
      {abierto && (
        <div className="flex items-center gap-1.5 rounded-l-2xl bg-noema-sage py-2.5 pl-3 pr-2.5 shadow-[0_8px_24px_-6px_rgba(61,77,62,0.6)]">
          <Link
            href="/paciente/crisis"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2 text-sm font-semibold text-bone"
          >
            <LifeBuoy className="size-5" strokeWidth={2} />
            Necesito apoyo
          </Link>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Ocultar"
            className="ml-1 rounded-full p-0.5 text-bone/70 hover:bg-bone/15 hover:text-bone"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
