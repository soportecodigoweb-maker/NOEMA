/**
 * Notificaciones push del paciente.
 *
 *   - Registra el token de Expo del dispositivo cuando hay sesión (para que el
 *     servidor pueda enviarle avisos) y lo refresca en cada arranque.
 *   - Al tocar una notificación (app abierta, en segundo plano o cerrada) lleva
 *     a la pantalla correspondiente según el `data.url` que manda el servidor.
 *
 * Solo actúa cuando el usuario ya pasó el onboarding: antes, el AuthGate está
 * redirigiendo y navegar aquí lo pelearía.
 */
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registrarPushToken, rutaDesdeNotificacion, type DatosPush } from '@/lib/notifications';

export function usePushNotifications({
  userId,
  rol,
  listo,
}: {
  userId: string | null | undefined;
  rol: 'paciente' | 'sin_terapeuta' | null;
  /** true cuando la sesión está resuelta y el usuario está dentro de la app. */
  listo: boolean;
}) {
  const router = useRouter();
  const respuesta = Notifications.useLastNotificationResponse();
  const atendida = useRef<string | null>(null);

  // 1. Registrar el token (pide permiso la primera vez).
  useEffect(() => {
    if (!listo || !userId || !rol) return;
    registrarPushToken().catch(() => {});
  }, [listo, userId, rol]);

  // 2. Navegar al tocar una notificación. `useLastNotificationResponse` cubre
  //    tanto el arranque en frío como los toques con la app en segundo plano.
  useEffect(() => {
    if (!listo || !rol || !respuesta) return;
    const id = respuesta.notification.request.identifier;
    if (atendida.current === id) return;
    atendida.current = id;

    const data = respuesta.notification.request.content.data as DatosPush | undefined;
    const ruta = rutaDesdeNotificacion(data, rol);

    // Pequeña espera para que el AuthGate termine su propio replace() inicial.
    const t = setTimeout(() => router.push(ruta), 250);
    return () => clearTimeout(t);
  }, [listo, rol, respuesta, router]);
}
