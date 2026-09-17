/**
 * Notificaciones de la app paciente (expo-notifications).
 *
 * Dos piezas:
 *
 *   1. LOCALES — recordatorios de tareas y alarmas propias (requerimiento #3).
 *      Se programan en el dispositivo; no necesitan servidor ni tokens.
 *
 *   2. PUSH REMOTAS — mensajes del terapeuta, tareas asignadas, recordatorios
 *      de registro, etc. El servidor (trigger en `notificaciones` → pg_net →
 *      Expo Push API) las envía a los tokens guardados en `push_tokens`.
 *      Aquí registramos el token del dispositivo, lo borramos al cerrar sesión
 *      y traducimos el `data.url` (ruta web) a la pantalla de la app.
 *
 * Canales Android (deben coincidir con `channelId` que manda el servidor):
 *   - 'recordatorios' → locales, importancia normal.
 *   - 'avisos'        → push del terapeuta/NOEMA, importancia alta (banner).
 *   - 'crisis'        → alertas de crisis, importancia máxima.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Href } from 'expo-router';
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

/** Crea (o actualiza) los canales de Android. En iOS no hace nada. */
async function asegurarCanalesAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('recordatorios', {
    name: 'Recordatorios',
    description: 'Recordatorios de tareas y alarmas que tú programas.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('avisos', {
    name: 'Avisos de NOEMA',
    description: 'Mensajes de tu terapeuta, tareas nuevas y recordatorios de registro.',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    lightColor: '#2E3B2E',
  });
  await Notifications.setNotificationChannelAsync('crisis', {
    name: 'Alertas de apoyo',
    description: 'Avisos urgentes relacionados con el botón de apoyo.',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
  });
}

/** Pide permiso de notificaciones y configura los canales Android. */
export async function asegurarPermisoNotificaciones(): Promise<boolean> {
  await asegurarCanalesAndroid();

  const { status: existente } = await Notifications.getPermissionsAsync();
  if (existente === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Locales ──────────────────────────────────────────────────────────────────

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

// ── Push remotas ─────────────────────────────────────────────────────────────

/** Token de Expo de este dispositivo (se conoce tras registrarlo). */
let tokenActual: string | null = null;

/**
 * Obtiene el token de push de Expo. Devuelve null en simuladores, en web, sin
 * permiso o sin credenciales (FCM/APNs) configuradas en el proyecto de EAS.
 *
 * @param pedirPermiso si es false, solo consulta el permiso (no muestra el
 *   diálogo del sistema); útil al cerrar sesión.
 */
async function obtenerExpoPushToken(pedirPermiso: boolean): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  let permitido: boolean;
  if (pedirPermiso) {
    permitido = await asegurarPermisoNotificaciones();
  } else {
    permitido = (await Notifications.getPermissionsAsync()).status === 'granted';
  }
  if (!permitido) return null;

  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
    ?.eas?.projectId;
  if (!projectId) return null;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token || null;
}

/**
 * Registra el token de push de este dispositivo para el usuario autenticado y
 * lo guarda en la BD (RPC `registrar_push_token`: reasigna el token si el
 * teléfono cambió de cuenta). El servidor lo usa para enviar push vía Expo.
 * Si no hay FCM/APNs configurado aún, falla en silencio (no rompe la app).
 */
export async function registrarPushToken(): Promise<void> {
  try {
    const token = await obtenerExpoPushToken(true);
    if (!token) return;
    const { error } = await supabase.rpc('registrar_push_token', {
      p_token: token,
      p_plataforma: Platform.OS,
    });
    if (!error) tokenActual = token;
  } catch {
    /* sin credenciales de push (FCM/APNs) o simulador: se ignora */
  }
}

/**
 * Borra el token de este dispositivo de la BD. Llamar ANTES de cerrar sesión
 * (la RLS solo deja borrar los propios) para que el siguiente usuario del
 * teléfono, o nadie, reciba los avisos de esta cuenta.
 * Nunca tarda más de unos segundos ni lanza: no debe bloquear el logout.
 */
export async function eliminarPushToken(): Promise<void> {
  const trabajo = (async () => {
    const token = tokenActual ?? (await obtenerExpoPushToken(false));
    if (!token) return;
    await supabase.from('push_tokens').delete().eq('token', token);
    tokenActual = null;
  })();
  const limite = new Promise<void>((resolve) => setTimeout(resolve, 3000));
  try {
    await Promise.race([trabajo, limite]);
  } catch {
    /* sin red o sin token: no bloquear el cierre de sesión */
  }
}

/** Datos que el servidor adjunta a cada push (ver trigger enviar_push_notificacion). */
export interface DatosPush {
  notificacion_id?: string;
  tipo?: string;
  url?: string;
  vinculacion_id?: string;
}

/**
 * Traduce el `data.url` del servidor (rutas del panel web, p. ej.
 * `/paciente/mensajes`) a la pantalla correspondiente de la app.
 */
export function rutaDesdeNotificacion(
  data: DatosPush | undefined,
  rol: 'paciente' | 'sin_terapeuta',
): Href {
  if (rol === 'sin_terapeuta') return '/(sin-terapeuta)/inicio';

  const url = data?.url ?? '';
  if (url.startsWith('/paciente/mensajes')) return '/(paciente)/mensajes';
  if (url.startsWith('/paciente/tareas')) return '/(paciente)/tareas';
  if (url.startsWith('/paciente/registros')) return '/(paciente)/registro';
  if (url.startsWith('/paciente/diario')) return '/(paciente)/diario';
  if (url.startsWith('/paciente/sesiones')) return '/(paciente)/sesiones';
  if (url.startsWith('/paciente/metas')) return '/(paciente)/mis-metas';

  // Por tipo, cuando la URL no dice nada útil.
  switch (data?.tipo) {
    case 'mensaje':
      return '/(paciente)/mensajes';
    case 'tarea':
      return '/(paciente)/tareas';
    case 'recordatorio':
      return '/(paciente)/registro/nuevo';
    default:
      return '/(paciente)/inicio';
  }
}
