'use client';

import { useEffect, useState } from 'react';
import { Vesica } from '@/components/ui/Vesica';
import {
  obtenerMensajeNoemaAction,
  marcarMensajeNoemaVistoAction,
  type MensajeNoema as Mensaje,
} from '../../../app/paciente/mensaje-noema-actions';

/**
 * Tarjeta "NOEMA para ti": mensaje de acompañamiento generado a partir de los
 * propios registros del paciente. Se genera como máximo una vez al día.
 *
 * Se pide desde el cliente (no en el render del servidor) para no retrasar la
 * carga de la pantalla mientras el modelo responde.
 */
export function MensajeNoema() {
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'oculto' | 'aviso'>(
    'cargando',
  );
  const [aviso, setAviso] = useState<string>('');

  useEffect(() => {
    let vigente = true;

    obtenerMensajeNoemaAction()
      .then((r) => {
        if (!vigente) return;
        if (r.ok && r.mensaje) {
          setMensaje(r.mensaje);
          setEstado('listo');
          marcarMensajeNoemaVistoAction(r.mensaje.id);
        } else if (r.motivo === 'riesgo' && r.texto) {
          setAviso(r.texto);
          setEstado('aviso');
        } else {
          // sin_datos / sin_ia / error → no mostramos nada.
          setEstado('oculto');
        }
      })
      .catch(() => vigente && setEstado('oculto'));

    return () => {
      vigente = false;
    };
  }, []);

  if (estado === 'oculto') return null;

  return (
    <div className="rounded-2xl border-[0.5px] border-noema-sage/25 bg-gradient-to-br from-noema-sage/[0.07] to-transparent p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
          <Vesica size={22} color="#3D4D3E" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-noema-sage">
            NOEMA para ti
          </p>

          {estado === 'cargando' && (
            <div className="mt-2 space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-noema-deep/[0.07]" />
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-noema-deep/[0.07]" />
            </div>
          )}

          {estado === 'aviso' && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{aviso}</p>
          )}

          {estado === 'listo' && mensaje && (
            <>
              <p className="mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink/85">
                {mensaje.texto}
              </p>
              <p className="mt-3 text-[11px] text-foreground-muted">
                Escrito a partir de tus propios registros. No es diagnóstico ni
                sustituye a tu terapeuta.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
