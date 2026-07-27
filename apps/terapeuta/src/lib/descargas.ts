/**
 * Enlaces de descarga de la app móvil NOEMA.
 *
 * Cuando cada versión esté lista, reemplaza `null` por la URL correspondiente
 * y el botón de la landing se activa automáticamente (mientras sea `null`,
 * se muestra en estado "Próximamente").
 *
 * - Android: APK directo alojado en el Storage self-hosted de Supabase, ej.
 *   'https://api.somosnoema.com/storage/v1/object/public/descargas/noema-android.apk'
 * - iOS: enlace público de TestFlight, ej. 'https://testflight.apple.com/join/XXXXXXXX'
 */
export const DESCARGA_ANDROID_URL: string | null = null;
export const DESCARGA_IOS_URL: string | null = null;

/** Requisito mínimo mostrado junto al botón de Android. */
export const ANDROID_MINIMO = 'Android 8 o superior';
/** Etiqueta del canal de iOS mientras está en beta por TestFlight. */
export const IOS_CANAL = 'Beta por TestFlight';
