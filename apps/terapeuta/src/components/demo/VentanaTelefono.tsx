'use client';

import { useEffect, useRef } from 'react';
import { AppEmbebida, type AppEmbebidaHandle } from './AppEmbebida';
import { AppEscalada, MarcoTelefono, TELEFONO } from './Marcos';
import type { Accion } from '@/lib/demo/tipos';

export interface VentanaTelefonoProps {
  ruta: string;
  rotulo: string;
  acciones: Accion[];
  /** Se llama cuando el guion del teléfono terminó. */
  onListo: () => void;
}

/**
 * "Así lo ve tu paciente": la pantalla se oscurece y flota un teléfono con la
 * app del otro rol corriendo sola. El teléfono es un iframe con su propia
 * sesión (la del paciente demo), así lo que se ve es real.
 */
export function VentanaTelefono({ ruta, rotulo, acciones, onListo }: VentanaTelefonoProps) {
  const app = useRef<AppEmbebidaHandle>(null);
  const corrido = useRef(false);
  const onListoRef = useRef(onListo);
  onListoRef.current = onListo;

  useEffect(() => {
    corrido.current = false;
    let vivo = true;
    (async () => {
      // Pequeña espera para que el marco termine de entrar antes de operar.
      await new Promise((r) => setTimeout(r, 700));
      if (!vivo || corrido.current) return;
      corrido.current = true;
      await app.current?.ejecutar(acciones);
      if (vivo) onListoRef.current();
    })();
    return () => {
      vivo = false;
      app.current?.cancelar();
    };
  }, [ruta, acciones]);

  const ancho = typeof window !== 'undefined' && window.innerWidth < 640 ? 250 : 300;

  return (
    <>
      <div className="demo-oscuro" aria-hidden />
      <div className="demo-ventana-tel" role="dialog" aria-label="Así lo ve tu paciente">
        <p className="demo-ventana-tel-rotulo">
          <b>Así lo ve tu paciente</b>
          {rotulo}
        </p>
        <MarcoTelefono ancho={ancho}>
          <AppEscalada ancho={TELEFONO.ancho} alto={TELEFONO.alto}>
            {() => (
              <AppEmbebida
                ref={app}
                src={ruta}
                ancho={TELEFONO.ancho}
                alto={TELEFONO.alto}
                titulo="App del paciente"
              />
            )}
          </AppEscalada>
        </MarcoTelefono>
      </div>
    </>
  );
}
