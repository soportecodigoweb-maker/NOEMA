'use client';

import { useCallback, useEffect, useState } from 'react';
import { buscar } from '@/lib/demo/motor';

export interface Marco {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Oscurece la pantalla y enmarca el bloque del que habla el recorrido.
 * Mide el elemento y lo vuelve a medir con scroll y cambios de tamaño.
 */
export function Resaltado({
  sel,
  desplazar,
  onMarco,
}: {
  sel: string | null;
  desplazar: boolean;
  onMarco?: (m: Marco | null) => void;
}) {
  const [marco, setMarco] = useState<Marco | null>(null);

  const medir = useCallback(() => {
    if (!sel) {
      setMarco(null);
      onMarco?.(null);
      return;
    }
    const el = buscar(sel);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const pad = 8;
    const m = {
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    };
    setMarco(m);
    onMarco?.(m);
  }, [sel, onMarco]);

  useEffect(() => {
    if (!sel) {
      medir();
      return;
    }
    const el = buscar(sel);
    if (el && desplazar) {
      const r = el.getBoundingClientRect();
      const fuera = r.top < 80 || r.bottom > window.innerHeight - 40;
      if (fuera)
        el.scrollIntoView({
          behavior: 'smooth',
          block: r.height > window.innerHeight * 0.7 ? 'start' : 'center',
        });
    }
    const ts = [40, 260, 560, 900].map((ms) => window.setTimeout(medir, ms));
    return () => ts.forEach(clearTimeout);
  }, [sel, desplazar, medir]);

  useEffect(() => {
    if (!sel) return;
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(medir);
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    const iv = window.setInterval(medir, 700);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, [sel, medir]);

  if (!marco) return null;
  return (
    <div
      className={`demo-resaltado ${sel ? '' : 'oculto'}`}
      style={{ top: marco.top, left: marco.left, width: marco.width, height: marco.height }}
      aria-hidden
    />
  );
}
