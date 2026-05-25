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
 * Formato de fecha en español MX.
 */
export function formatFecha(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatFechaCorta(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
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
