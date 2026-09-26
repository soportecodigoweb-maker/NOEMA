'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, X } from 'lucide-react';
import type { VideoDemo } from '@/lib/demo/tipos';
import type { RolDemo } from '@/lib/demo/constantes';
import { Diapositiva } from './Diapositiva';
import '../demo.css';

interface Props {
  video: VideoDemo;
  rol: RolDemo;
  vinc: string | null;
  /** A dónde vuelve la X. */
  volverA: string;
}

/**
 * Reproductor del video demo: barra de progreso segmentada, controles,
 * contador "04 / 12", avance automático, teclado y pantalla completa.
 * La pausa detiene las diapositivas, no las animaciones internas.
 */
export function Reproductor({ video, rol, vinc, volverA }: Props) {
  const router = useRouter();
  const raiz = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [pantalla, setPantalla] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const elapsed = useRef(0);
  const pausadoRef = useRef(false);
  pausadoRef.current = pausado;
  const cambiando = useRef(false);

  const diapositivas = video.diapositivas;
  const total = diapositivas.length;
  const actual = diapositivas[idx]!;

  const irA = useCallback(
    (n: number) => {
      if (cambiando.current) return;
      const destino = Math.max(0, Math.min(total - 1, n));
      if (destino === idx) return;
      cambiando.current = true;
      setSaliendo(true);
      window.setTimeout(() => {
        setIdx(destino);
        elapsed.current = 0;
        setProgreso(0);
        setSaliendo(false);
        cambiando.current = false;
      }, 320);
    },
    [idx, total],
  );

  // Cronómetro de la diapositiva: avanza sola al terminar (si no está en pausa).
  useEffect(() => {
    elapsed.current = 0;
    setProgreso(0);
    const iv = window.setInterval(() => {
      if (pausadoRef.current || cambiando.current) return;
      elapsed.current += 100;
      const p = Math.min(1, elapsed.current / actual.ms);
      setProgreso(p);
      if (p >= 1) {
        if (idx < total - 1) irA(idx + 1);
        else setPausado(true); // última: se queda con su invitación
      }
    }, 100);
    return () => clearInterval(iv);
  }, [idx, actual.ms, total, irA]);

  // Teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') irA(idx + 1);
      else if (e.key === 'ArrowLeft') irA(idx - 1);
      else if (e.key === ' ') {
        e.preventDefault();
        setPausado((p) => !p);
      } else if (e.key === 'Escape') router.push(volverA);
      else if (e.key.toLowerCase() === 'f') alternarPantalla();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, irA, router, volverA]);

  const alternarPantalla = () => {
    const el = raiz.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
        .then(() => setPantalla(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => setPantalla(false))
        .catch(() => {});
    }
  };
  useEffect(() => {
    const onFs = () => setPantalla(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  return (
    <div ref={raiz} className="demo-video" role="region" aria-label="Video demo de NOEMA">
      <div className="demo-video-aro" aria-hidden />

      {/* Progreso segmentado: una rayita por diapositiva */}
      <div className="demo-video-progreso" aria-hidden>
        {diapositivas.map((d, i) => (
          <span key={d.id}>
            <i style={{ ['--p' as string]: i < idx ? 1 : i === idx ? progreso : 0 }} />
          </span>
        ))}
      </div>

      {/* Actual + siguiente (precargada, oculta) */}
      {diapositivas.slice(idx, idx + 2).map((d, i) => (
        <Diapositiva
          key={d.id}
          d={d}
          rol={rol}
          activa={i === 0}
          oculta={i !== 0}
          saliendo={i === 0 && saliendo}
          vinc={vinc}
          total={total}
          numero={idx + i + 1}
        />
      ))}

      <div className="demo-video-controles">
        <button onClick={() => irA(idx - 1)} aria-label="Anterior" disabled={idx === 0}>
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => setPausado((p) => !p)}
          aria-label={pausado ? 'Reproducir' : 'Pausar'}
        >
          {pausado ? <Play className="ml-0.5 size-5" /> : <Pause className="size-5" />}
        </button>
        <button onClick={() => irA(idx + 1)} aria-label="Siguiente" disabled={idx >= total - 1}>
          <ChevronRight className="size-5" />
        </button>
        <span className="demo-video-contador">
          {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <button onClick={alternarPantalla} aria-label="Pantalla completa">
          {pantalla ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
        <button onClick={() => router.push(volverA)} aria-label="Cerrar">
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}
