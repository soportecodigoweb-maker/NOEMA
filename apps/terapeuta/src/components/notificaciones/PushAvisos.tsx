'use client';

import { useEffect, useState } from 'react';
import { BellRing, BellOff, Send, Smartphone } from 'lucide-react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { vapidPublicaBytes } from '@/lib/push-vapid';

type Estado = 'cargando' | 'no_soportado' | 'bloqueado' | 'apagado' | 'prendido';

function esIosSinInstalar(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalada =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return ios && !instalada;
}

/**
 * Control "Avisos en este dispositivo" (push web / VAPID). Vive al pie de la
 * campanita, así sale igual para terapeutas y pacientes.
 *
 * Cada vez que se monta (= cada vez que se abre la campanita) y el navegador
 * ya está suscrito, vuelve a registrar la suscripción: la RPC la reasigna al
 * usuario con sesión, así un navegador compartido no sigue mandando los avisos
 * a la cuenta anterior.
 */
export function PushAvisos() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const registrar = async (sub: PushSubscription) => {
    const json = sub.toJSON();
    const { error } = await supabase.rpc('registrar_push_suscripcion', {
      p_endpoint: sub.endpoint,
      p_p256dh: json.keys?.p256dh ?? '',
      p_auth: json.keys?.auth ?? '',
      p_user_agent: navigator.userAgent.slice(0, 300),
    });
    if (error) throw new Error(error.message);
  };

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        setEstado('no_soportado');
        return;
      }
      if (Notification.permission === 'denied') {
        setEstado('bloqueado');
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!vivo) return;
        if (sub) {
          // Ya suscrito: re-guardar bajo el usuario actual (reasigna dueño).
          await registrar(sub);
          setEstado('prendido');
        } else {
          setEstado('apagado');
        }
      } catch {
        if (vivo) setEstado('apagado');
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activar = async () => {
    setOcupado(true);
    setMensaje(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'bloqueado' : 'apagado');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicaBytes() as BufferSource,
        }));
      await registrar(sub);
      setEstado('prendido');
      setMensaje('Listo. Este dispositivo recibirá avisos.');
    } catch (e) {
      setMensaje(`No se pudo activar: ${e instanceof Error ? e.message : 'error'}`);
    } finally {
      setOcupado(false);
    }
  };

  const desactivar = async () => {
    setOcupado(true);
    setMensaje(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_suscripciones').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado('apagado');
      setMensaje('Avisos desactivados en este dispositivo.');
    } catch (e) {
      setMensaje(`No se pudo desactivar: ${e instanceof Error ? e.message : 'error'}`);
    } finally {
      setOcupado(false);
    }
  };

  const probar = async () => {
    setOcupado(true);
    setMensaje(null);
    try {
      const r = await fetch('/api/push/prueba', { method: 'POST' });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setMensaje(
        j.ok
          ? 'Enviada. Debe llegar en unos segundos.'
          : `No se pudo enviar: ${j.error ?? r.status}`,
      );
    } catch {
      setMensaje('No se pudo enviar la prueba.');
    } finally {
      setOcupado(false);
    }
  };

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
          Los avisos están bloqueados en el navegador. Permítelos en la configuración del
          sitio y recarga.
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
