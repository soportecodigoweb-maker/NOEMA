'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { vapidPublicaBytes } from '@/lib/push-vapid';

export type EstadoPush = 'cargando' | 'no_soportado' | 'bloqueado' | 'apagado' | 'prendido';

/** iPhone/iPad abierto en Safari, sin instalar como app: ahí iOS no permite push. */
export function esIosSinInstalar(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalada =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return ios && !instalada;
}

/**
 * Estado y acciones de los avisos push (web-push / VAPID) en ESTE dispositivo.
 * Lo comparten la invitación al entrar y el control de la campanita.
 *
 * Al montarse, si el navegador ya está suscrito, vuelve a registrar la
 * suscripción: la RPC la reasigna al usuario con sesión, así un navegador
 * compartido no sigue mandando los avisos a la cuenta anterior.
 */
export function usePushSuscripcion() {
  const [estado, setEstado] = useState<EstadoPush>('cargando');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const registrar = useCallback(
    async (sub: PushSubscription) => {
      const json = sub.toJSON();
      const { error } = await supabase.rpc('registrar_push_suscripcion', {
        p_endpoint: sub.endpoint,
        p_p256dh: json.keys?.p256dh ?? '',
        p_auth: json.keys?.auth ?? '',
        p_user_agent: navigator.userAgent.slice(0, 300),
      });
      if (error) throw new Error(error.message);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
  }, [registrar]);

  /** Pide el permiso del navegador (debe llamarse desde un clic) y suscribe. */
  const activar = useCallback(async (): Promise<boolean> => {
    setOcupado(true);
    setMensaje(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'bloqueado' : 'apagado');
        return false;
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
      return true;
    } catch (e) {
      setMensaje(`No se pudo activar: ${e instanceof Error ? e.message : 'error'}`);
      return false;
    } finally {
      setOcupado(false);
    }
  }, [registrar]);

  const desactivar = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const probar = useCallback(async () => {
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
  }, []);

  return { estado, ocupado, mensaje, activar, desactivar, probar };
}
