'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Tamaño "real" al que se carga la app dentro de cada marco. */
export const LAPTOP = { ancho: 1280, alto: 800 };
export const TELEFONO = { ancho: 390, alto: 820 };

/**
 * Carga la app a un tamaño fijo y la escala para llenar el contenedor. Así el
 * panel se ve como en una laptop y la app del paciente como en un teléfono,
 * sin importar el tamaño de la ventana del visitante.
 */
export function AppEscalada({
  ancho,
  alto,
  children,
}: {
  ancho: number;
  alto: number;
  children: (escala: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.5);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setEscala(el.clientWidth / ancho);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ancho]);
  return (
    <div ref={ref} className="absolute inset-0">
      <div
        className="demo-app"
        style={{ width: ancho, height: alto, transform: `scale(${escala})` }}
      >
        {children(escala)}
      </div>
    </div>
  );
}

export function MarcoLaptop({ children }: { children: ReactNode }) {
  return (
    <div className="demo-laptop">
      <div className="demo-laptop-pantalla">
        <div className="demo-laptop-vidrio">{children}</div>
      </div>
      <div className="demo-laptop-base" />
    </div>
  );
}

export function MarcoTelefono({ children, ancho = 300 }: { children: ReactNode; ancho?: number }) {
  return (
    <div className="demo-telefono" style={{ ['--tel-ancho' as string]: `${ancho}px` }}>
      <div className="demo-telefono-isla" />
      <div className="demo-telefono-vidrio">{children}</div>
    </div>
  );
}
