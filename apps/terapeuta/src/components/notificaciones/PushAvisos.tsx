'use client';

import { BellRing, BellOff, Send, Smartphone } from 'lucide-react';
import { esIosSinInstalar, usePushSuscripcion } from '@/hooks/usePushSuscripcion';

/**
 * Control "Avisos en este dispositivo" (push web / VAPID). Vive al pie de la
 * campanita, así sale igual para terapeutas y pacientes.
 *
 * La invitación grande al entrar es `InvitacionPush`; esto es el control fino
 * (desactivar, mandar prueba) para quien ya sabe dónde está.
 */
export function PushAvisos() {
  const { estado, ocupado, mensaje, activar, desactivar, probar } = usePushSuscripcion();

  const btn =
    'inline-flex items-center gap-1.5 rounded-md border border-noema-deep/15 px-2.5 py-1.5 text-xs text-noema-deep hover:bg-bone disabled:opacity-50';

  return (
    <div className="border-t border-noema-deep/8 bg-bone/40 px-4 py-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-noema-deep">
        <Smartphone className="size-3.5" strokeWidth={1.8} />
        Avisos en este dispositivo
      </p>

      {estado === 'cargando' && <p className="text-xs text-foreground-muted">Revisando…</p>}

      {estado === 'no_soportado' && (
        <p className="text-xs text-foreground-muted">
          {esIosSinInstalar()
            ? 'En iPhone: Compartir → "Agregar a inicio", abre NOEMA desde el ícono y vuelve aquí para activar los avisos.'
            : 'Este navegador no soporta avisos push.'}
        </p>
      )}

      {estado === 'bloqueado' && (
        <p className="text-xs text-foreground-muted">
          Los avisos están bloqueados en el navegador. Permítelos en la configuración del sitio y
          recarga.
        </p>
      )}

      {(estado === 'apagado' || estado === 'prendido') && (
        <div className="flex flex-wrap gap-2">
          {estado === 'apagado' ? (
            <button onClick={activar} disabled={ocupado} className={btn}>
              <BellRing className="size-3.5" strokeWidth={1.8} />
              Activar avisos
            </button>
          ) : (
            <>
              <button onClick={desactivar} disabled={ocupado} className={btn}>
                <BellOff className="size-3.5" strokeWidth={1.8} />
                Desactivar
              </button>
              <button onClick={probar} disabled={ocupado} className={btn}>
                <Send className="size-3.5" strokeWidth={1.8} />
                Mándame una de prueba
              </button>
            </>
          )}
        </div>
      )}

      {mensaje && <p className="mt-2 text-[11px] text-foreground-muted">{mensaje}</p>}
    </div>
  );
}
