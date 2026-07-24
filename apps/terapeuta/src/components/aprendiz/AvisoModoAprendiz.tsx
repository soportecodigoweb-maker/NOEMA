'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GraduationCap, X } from 'lucide-react';

/**
 * Aviso de "dónde está el modo aprendiz".
 *
 * La primera vez que alguien entra a la app, el modo aprendiz ya está activo y
 * el tour corre solo (viene encendido por defecto). En las siguientes 3
 * entradas mostramos este anuncio recordando dónde activarlo o desactivarlo.
 * Después, ya no aparece.
 *
 * "Entrada" = una sesión de navegador nueva (se cuenta una sola vez por
 * sessionStorage; el total vive en localStorage).
 */
export function AvisoModoAprendiz() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const esPaciente = pathname.startsWith('/paciente');
  const lugar = esPaciente ? 'Mi cuenta' : 'Ajustes';

  useEffect(() => {
    let entradas = 0;
    try {
      const yaContada = window.sessionStorage.getItem('noema:entrada-contada');
      entradas = Number(window.localStorage.getItem('noema:entradas-app') || '0');
      if (!yaContada) {
        entradas += 1;
        window.localStorage.setItem('noema:entradas-app', String(entradas));
        window.sessionStorage.setItem('noema:entrada-contada', '1');
      }
    } catch {
      return;
    }
    // Entradas 2, 3 y 4 (las "3 veces más" después de la primera).
    if (entradas >= 2 && entradas <= 4) {
      setVisible(true);
      const t = window.setTimeout(() => setVisible(false), 12000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[58] mx-auto max-w-md rounded-2xl border border-noema-sage/30 bg-white/95 p-3.5 shadow-xl backdrop-blur lg:left-auto lg:right-6 lg:mx-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
          <GraduationCap className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Modo aprendiz</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/70">
            ¿Necesitas una guía por la app? Puedes activarlo o desactivarlo cuando
            quieras desde <span className="font-medium text-noema-deep">{lugar}</span>.
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Cerrar aviso"
          className="rounded p-0.5 text-foreground-muted hover:bg-bone hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
