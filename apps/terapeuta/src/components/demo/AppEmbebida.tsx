'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MSG } from '@/lib/demo/constantes';
import type { Accion } from '@/lib/demo/tipos';

export interface AppEmbebidaHandle {
  /** Manda un guion a la app embebida y espera a que termine. */
  ejecutar: (acciones: Accion[]) => Promise<void>;
  cancelar: () => void;
  /** ¿La app ya avisó que está lista? */
  lista: () => boolean;
}

interface Props {
  src: string;
  ancho: number;
  alto: number;
  titulo?: string;
  onChip?: (texto: string) => void;
  onLista?: () => void;
  className?: string;
}

/**
 * Iframe con la app real (misma origen, sesión demo) controlado por
 * postMessage. La app embebida corre el mismo motor del demo en "modo
 * embebido": sin tira ni tarjeta, solo cursor y resaltado dentro del marco.
 */
export const AppEmbebida = forwardRef<AppEmbebidaHandle, Props>(function AppEmbebida(
  { src, ancho, alto, titulo, onChip, onLista, className },
  ref,
) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [lista, setLista] = useState(false);
  const listaRef = useRef(false);
  const pendientes = useRef(new Map<string, () => void>());
  const esperandoLista = useRef<Array<() => void>>([]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow) return;
      const d = e.data as { tipo?: string; id?: string; texto?: string } | null;
      if (!d || typeof d !== 'object') return;
      if (d.tipo === MSG.hola) {
        listaRef.current = true;
        setLista(true);
        onLista?.();
        esperandoLista.current.splice(0).forEach((f) => f());
      } else if (d.tipo === MSG.listo && d.id) {
        pendientes.current.get(d.id)?.();
        pendientes.current.delete(d.id);
      } else if (d.tipo === MSG.chip && d.texto) {
        onChip?.(d.texto);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [onChip, onLista]);

  const esperarLista = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (listaRef.current) return resolve();
        esperandoLista.current.push(resolve);
        // Si la app nunca avisa (p. ej. error de carga), seguimos a los 8 s.
        window.setTimeout(resolve, 8000);
      }),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      lista: () => listaRef.current,
      cancelar: () => {
        iframe.current?.contentWindow?.postMessage({ tipo: MSG.cancelar }, window.location.origin);
        pendientes.current.forEach((f) => f());
        pendientes.current.clear();
      },
      ejecutar: async (acciones) => {
        await esperarLista();
        const id = Math.random().toString(36).slice(2);
        await new Promise<void>((resolve) => {
          pendientes.current.set(id, resolve);
          iframe.current?.contentWindow?.postMessage(
            { tipo: MSG.guion, id, acciones },
            window.location.origin,
          );
        });
      },
    }),
    [esperarLista],
  );

  return (
    <iframe
      ref={iframe}
      src={src}
      title={titulo ?? 'NOEMA'}
      width={ancho}
      height={alto}
      className={className}
      style={{
        width: ancho,
        height: alto,
        border: 0,
        opacity: lista ? 1 : 0.001,
        transition: 'opacity 0.4s',
      }}
      // Mismo origen y mismas cookies: no hace falta sandbox (y evita avisos en consola).
    />
  );
});
