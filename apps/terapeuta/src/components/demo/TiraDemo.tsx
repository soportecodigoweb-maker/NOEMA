'use client';

import { useState } from 'react';
import { Compass, LogOut, RotateCcw, ArrowLeftRight, Loader2 } from 'lucide-react';
import type { RolDemo } from '@/lib/demo/constantes';

interface Props {
  rol: RolDemo;
  recorriendo: boolean;
  onRecorrido: () => void;
}

/**
 * Tira fija superior del sandbox: "Estás viendo como psicóloga. Todo se
 * reinicia solo cada día", con Recorrido guiado, Ver como (otro rol),
 * Reiniciar demo y Salir del demo. No hay cuenta maestra.
 */
export function TiraDemo({ rol, recorriendo, onRecorrido }: Props) {
  const [reiniciando, setReiniciando] = useState(false);
  const otro = rol === 'psicologo' ? 'paciente' : 'psicologo';

  const cambiarRol = () => {
    // Carga completa: cada rol usa su propia sesión (ver lib/demo/constantes).
    window.location.href = `/demo/entrar?rol=${otro}`;
  };

  const reiniciar = async () => {
    if (reiniciando) return;
    if (
      !window.confirm(
        '¿Reiniciar el demo? Se borra lo que hayas cambiado y vuelve la historia original.',
      )
    )
      return;
    setReiniciando(true);
    try {
      const r = await fetch('/demo/reiniciar', { method: 'POST' });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (j.ok) {
        try {
          sessionStorage.removeItem('noema:demo:recorrido:psicologo');
          sessionStorage.removeItem('noema:demo:recorrido:paciente');
        } catch {
          /* noop */
        }
        window.location.href = rol === 'psicologo' ? '/inicio' : '/paciente';
        return;
      }
    } catch {
      /* noop */
    }
    setReiniciando(false);
    window.alert('No se pudo reiniciar. Intenta de nuevo.');
  };

  const btn =
    'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-bone/90 transition-colors hover:bg-bone/10 disabled:opacity-50';

  return (
    <div
      className="fixed inset-x-0 top-0 z-[95] flex h-[44px] items-center gap-2 border-b border-bone/10 bg-[#1D271E] px-3 text-bone"
      role="region"
      aria-label="Modo demo"
    >
      <span className="hidden items-center gap-2 text-[12px] text-bone/80 sm:inline-flex">
        <span className="inline-block size-2 rounded-full bg-[#E2B6A5]" />
        Estás viendo como{' '}
        <b className="font-medium text-bone">{rol === 'psicologo' ? 'psicóloga' : 'paciente'}</b>.
        <span className="hidden text-bone/55 md:inline">Todo se reinicia solo cada día.</span>
      </span>
      <span className="inline-flex items-center gap-2 text-[12px] text-bone/80 sm:hidden">
        <span className="inline-block size-2 rounded-full bg-[#E2B6A5]" />
        Demo · {rol === 'psicologo' ? 'psicóloga' : 'paciente'}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button onClick={onRecorrido} className={`${btn} ${recorriendo ? 'bg-bone/10' : ''}`}>
          <Compass className="size-3.5" strokeWidth={1.9} />
          <span className="hidden sm:inline">Recorrido guiado</span>
        </button>
        <button onClick={cambiarRol} className={btn}>
          <ArrowLeftRight className="size-3.5" strokeWidth={1.9} />
          <span>
            <span className="hidden sm:inline">Ver como </span>
            {otro === 'paciente' ? 'paciente' : 'psicóloga'}
          </span>
        </button>
        <button onClick={reiniciar} disabled={reiniciando} className={btn}>
          {reiniciando ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" strokeWidth={1.9} />
          )}
          <span className="hidden sm:inline">Reiniciar demo</span>
        </button>
        <a href="/demo/salir" className={btn}>
          <LogOut className="size-3.5" strokeWidth={1.9} />
          <span className="hidden sm:inline">Salir del demo</span>
        </a>
      </div>
    </div>
  );
}
