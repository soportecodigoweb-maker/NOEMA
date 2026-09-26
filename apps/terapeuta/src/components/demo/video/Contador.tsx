'use client';

import { useEffect, useState } from 'react';

/** Número que sube desde 0 hasta `hasta` (con formato de miles). */
export function Contador({
  hasta,
  ms = 1500,
  retrasoMs = 0,
  prefijo = '',
  sufijo = '',
  className,
}: {
  hasta: number;
  ms?: number;
  retrasoMs?: number;
  prefijo?: string;
  sufijo?: string;
  className?: string;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let inicio = 0;
    const t = window.setTimeout(() => {
      const paso = (ahora: number) => {
        if (!inicio) inicio = ahora;
        const p = Math.min(1, (ahora - inicio) / ms);
        const e = 1 - Math.pow(1 - p, 3);
        setV(Math.round(hasta * e));
        if (p < 1) raf = requestAnimationFrame(paso);
      };
      raf = requestAnimationFrame(paso);
    }, retrasoMs);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [hasta, ms, retrasoMs]);
  return (
    <span className={className}>
      {prefijo}
      {v.toLocaleString('es-MX')}
      {sufijo}
    </span>
  );
}
