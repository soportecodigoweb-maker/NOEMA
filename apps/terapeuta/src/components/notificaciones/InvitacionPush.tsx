'use client';

import { useEffect, useState } from 'react';
import { BellRing, Share, X } from 'lucide-react';
import { esIosSinInstalar, usePushSuscripcion } from '@/hooks/usePushSuscripcion';

/** Si la persona dice "Ahora no", volvemos a invitar después de estos días. */
const DIAS_ESPERA = 3;
const CLAVE_ESPERA = 'noema:push-invitacion-hasta';

function enEspera(): boolean {
  try {
    const hasta = Number(window.localStorage.getItem(CLAVE_ESPERA) || '0');
    return hasta > Date.now();
  } catch {
    return false;
  }
}

function posponer() {
  try {
    const hasta = Date.now() + DIAS_ESPERA * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(CLAVE_ESPERA, String(hasta));
  } catch {
    /* sin almacenamiento: se volverá a mostrar la próxima vez */
  }
}

/**
 * Invitación a activar los avisos push, visible al ENTRAR a la app (terapeuta,
 * paciente o centro), sin tener que buscar la campanita.
 *
 * El navegador solo permite pedir el permiso desde un clic de la persona, así
 * que esto no puede ser automático: se le muestra una tarjeta clara con el
 * botón. Se oculta cuando ya están activos, cuando el navegador los bloqueó
 * (ahí no podemos hacer nada) y durante unos días si dijo "Ahora no".
 *
 * En iPhone abierto desde Safari no hay push posible hasta instalar NOEMA en
 * la pantalla de inicio, así que en ese caso la tarjeta explica ese paso.
 */
export function InvitacionPush() {
  const { estado, ocupado, mensaje, activar } = usePushSuscripcion();
  const [cerrada, setCerrada] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(esIosSinInstalar());
    setCerrada(enEspera());
  }, []);

  const ahoraNo = () => {
    posponer();
    setCerrada(true);
  };

  const mostrarActivar = estado === 'apagado';
  const mostrarInstalar = estado === 'no_soportado' && ios;

  if (cerrada || (!mostrarActivar && !mostrarInstalar)) return null;

  return (
    <div
      role="dialog"
      aria-label="Activar avisos"
      className="fixed inset-x-3 bottom-20 z-[57] mx-auto max-w-md rounded-2xl border border-noema-sage/30 bg-white/95 p-4 shadow-xl backdrop-blur lg:left-auto lg:right-6 lg:mx-0"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
          {mostrarInstalar ? (
            <Share className="size-5" strokeWidth={1.8} />
          ) : (
            <BellRing className="size-5" strokeWidth={1.8} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {mostrarInstalar ? (
            <>
              <p className="text-sm font-medium text-ink">Instala NOEMA para recibir avisos</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/70">
                En iPhone los avisos solo llegan si NOEMA está en tu pantalla de inicio. Toca{' '}
                <span className="font-medium text-noema-deep">Compartir</span> en Safari, elige{' '}
                <span className="font-medium text-noema-deep">Agregar a inicio</span> y abre NOEMA
                desde el ícono. Ahí te pediremos activar los avisos.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-ink">Entérate al momento</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/70">
                Activa los avisos en este dispositivo para saber al instante cuando te escriben o
                hay algo nuevo en tu proceso, aunque NOEMA esté cerrada.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={activar}
                  disabled={ocupado}
                  className="inline-flex items-center gap-1.5 rounded-md bg-noema-deep px-3 py-2 text-xs font-medium text-bone hover:bg-noema-sage disabled:opacity-50"
                >
                  <BellRing className="size-3.5" strokeWidth={1.8} />
                  {ocupado ? 'Activando…' : 'Activar avisos'}
                </button>
                <button
                  onClick={ahoraNo}
                  disabled={ocupado}
                  className="rounded-md px-3 py-2 text-xs text-foreground-muted hover:bg-bone hover:text-ink disabled:opacity-50"
                >
                  Ahora no
                </button>
              </div>
              {mensaje && <p className="mt-2 text-[11px] text-foreground-muted">{mensaje}</p>}
            </>
          )}
        </div>

        <button
          onClick={ahoraNo}
          aria-label="Cerrar"
          className="rounded p-0.5 text-foreground-muted hover:bg-bone hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
