'use client';

import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import type { PasoRecorrido } from '@/lib/demo/tipos';
import type { Marco } from './Resaltado';

interface Props {
  paso: PasoRecorrido;
  idx: number;
  total: number;
  pausado: boolean;
  terminado: boolean;
  transcurridoMs: number;
  totalMs: number;
  marco: Marco | null;
  onAnterior: () => void;
  onSiguiente: () => void;
  onPausa: () => void;
  onCerrar: () => void;
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Tarjeta flotante que narra el recorrido: etiqueta, título, texto,
 * cronómetro con "quedan", controles y barra de progreso. Se reacomoda para
 * no tapar el bloque resaltado.
 */
export function TarjetaRecorrido({
  paso,
  idx,
  total,
  pausado,
  terminado,
  transcurridoMs,
  totalMs,
  marco,
  onAnterior,
  onSiguiente,
  onPausa,
  onCerrar,
}: Props) {
  // Posición: abajo a la izquierda; si el bloque resaltado cae ahí, a la derecha; si también, arriba a la derecha.
  const alto = typeof window !== 'undefined' ? window.innerHeight : 800;
  const ancho = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const caja = { w: Math.min(420, ancho - 32), h: 250 };
  const choca = (x: number, y: number) =>
    !!marco &&
    marco.left < x + caja.w &&
    marco.left + marco.width > x &&
    marco.top < y + caja.h &&
    marco.top + marco.height > y;
  type Pos = 'abajo-izq' | 'abajo-der' | 'arriba-der' | 'arriba-izq';
  let pos: Pos = paso.tarjeta === 'derecha' ? 'abajo-der' : 'abajo-izq';
  const candidatos: Pos[] =
    pos === 'abajo-der'
      ? ['abajo-der', 'abajo-izq', 'arriba-der', 'arriba-izq']
      : ['abajo-izq', 'abajo-der', 'arriba-izq', 'arriba-der'];
  for (const c of candidatos) {
    const x = c.endsWith('izq') ? 16 : ancho - 16 - caja.w;
    const y = c.startsWith('abajo') ? alto - 16 - caja.h : 60;
    if (!choca(x, y)) {
      pos = c;
      break;
    }
  }
  const estilo: React.CSSProperties = {
    width: caja.w,
    ...(pos.endsWith('izq') ? { left: 16 } : { right: 16 }),
    ...(pos.startsWith('abajo') ? { bottom: 16 } : { top: 60 }),
  };

  const pct = Math.min(100, Math.round((transcurridoMs / Math.max(1, totalMs)) * 100));
  const quedan = Math.max(0, totalMs - transcurridoMs);
  const btn =
    'inline-flex size-9 items-center justify-center rounded-full border border-noema-deep/15 text-ink hover:bg-bone disabled:opacity-40';

  return (
    <div
      key={paso.id}
      role="dialog"
      aria-label="Recorrido guiado"
      className="demo-anim-subir fixed z-[90] rounded-2xl border border-noema-deep/10 bg-[rgba(255,255,255,0.97)] p-5 shadow-[0_24px_60px_-20px_rgba(46,59,46,0.45)] backdrop-blur"
      style={{ ...estilo, transition: 'left 0.4s, right 0.4s, top 0.4s, bottom 0.4s' }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#B85450]">
          {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · {paso.etiqueta}
        </p>
        <button
          onClick={onCerrar}
          aria-label="Cerrar recorrido"
          className="rounded p-1 text-foreground-muted hover:bg-bone hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
      <h3 className="font-serif text-2xl leading-tight text-ink">{paso.titulo}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-ink/75">{paso.texto}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-wider text-foreground-muted">
          {mmss(transcurridoMs)} · {terminado ? 'listo' : `quedan ${mmss(quedan)}`}
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={onAnterior} disabled={idx === 0} className={btn} aria-label="Anterior">
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={onPausa}
            className={`${btn} bg-noema-deep text-bone hover:bg-noema-sage`}
            aria-label={pausado ? 'Continuar' : 'Pausar'}
          >
            {pausado || terminado ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <button
            onClick={onSiguiente}
            disabled={idx >= total - 1}
            className={btn}
            aria-label="Siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-noema-deep/10">
        <div
          className="h-full rounded-full bg-[#B85450] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
