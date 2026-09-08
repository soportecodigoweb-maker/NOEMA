/**
 * Notificaciones locales (requerimiento #3 — recordatorios de tareas + alarmas
 * propias del paciente).
 *
 * Usa expo-notifications con notificaciones LOCALES (programadas en el
 * dispositivo). NO requieren un servidor de push ni tokens — funcionan offline.
 *
 * NOTA: el envío REMOTO de push (mensajes de autoayuda del algoritmo #1, y
 * mensajes del terapeuta #2) sí requiere infraestructura de push server +
 * registro de tokens, que es una pieza aparte pendiente.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Mostrar notificaciones en primer plano también.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Pide permiso de notificaciones y configura el canal Android. */
export async function asegurarPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('recordatorios', {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const { status: existente } = await Notifications.getPermissionsAsync();
  if (existente === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Programa un recordatorio local para una fecha específica.
 * Devuelve el identificador para poder cancelarlo después.
 */
export async function programarRecordatorio(
  titulo: string,
  cuerpo: string,
  fecha: Date,
): Promise<string | null> {
  const ok = await asegurarPermisoNotificaciones();
  if (!ok) return null;
  if (fecha.getTime() <= Date.now()) return null; // no programar en el pasado

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fecha,
      channelId: 'recordatorios',
    },
  });
  return id;
}

/** Cancela un recordatorio programado. */
export async function cancelarRecordatorio(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignorar si ya no existe
  }
}

/**
 * Registra el token de push de este dispositivo para el usuario, y lo guarda en
 * la BD. El servidor lo usa para enviar notificaciones push (vía Expo).
 * Si no hay FCM/APNs configurado aún, falla en silencio (no rompe la app).
 */
export async function registrarPushToken(userId: string): Promise<void> {
  try {
    const permitido = await asegurarPermisoNotificaciones();
    if (!permitido) return;
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!projectId) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        plataforma: Platform.OS,
        actualizado_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
  } catch {
    /* sin credenciales de push (FCM/APNs) o simulador: se ignora */
  }
}
