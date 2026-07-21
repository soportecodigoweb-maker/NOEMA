import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind y resuelve conflictos (último gana).
 * Patrón estándar de shadcn/ui.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Zona horaria de referencia — todo NOEMA opera en hora de Ciudad de México (#5).
 * El servidor de Vercel corre en UTC, así que SIEMPRE pasamos timeZone en los
 * formatos para que el paciente vea su hora local correcta.
 */
export const TZ_MX = 'America/Mexico_City';

/**
 * Formato de fecha en español MX (hora de Ciudad de México).
 */
export function formatFecha(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ_MX,
  });
}

export function formatFechaCorta(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: TZ_MX });
}

/** Hora en formato 12h de CDMX. */
export function formatHora(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: TZ_MX });
}

/** Fecha + hora de CDMX. */
export function formatFechaHora(date: Date | string): string {
  return `${formatFecha(date)} · ${formatHora(date)}`;
}

/**
 * "Hace X días/horas/minutos"
 */
export function tiempoRelativo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(min / 60);
  const dias = Math.floor(hr / 24);

  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  if (hr < 24) return `Hace ${hr} h`;
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  return formatFechaCorta(d);
}
