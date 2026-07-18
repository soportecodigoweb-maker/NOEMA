/**
 * Configuración de niveles de riesgo del paciente (requerimiento #8).
 *
 * NO es diagnóstico clínico — es triage operativo que el terapeuta usa para
 * priorizar visualmente su lista de pacientes. Los colores siguen una lógica
 * de semáforo ampliada, coherente con la identidad NOEMA (tonos apagados, no
 * rojos estridentes salvo el nivel crítico).
 */

export type NivelRiesgo = 'sin_evaluar' | 'bajo' | 'medio' | 'alto' | 'critico';

export interface RiesgoConfig {
  label: string;
  /** Color del punto/indicador. Tailwind bg class. */
  dot: string;
  /** Fondo suave para badges. */
  badgeBg: string;
  /** Texto del badge. */
  badgeText: string;
  /** Descripción para tooltips/selector. */
  descripcion: string;
  /** Orden para ordenar por gravedad descendente. */
  orden: number;
}

export const RIESGO: Record<NivelRiesgo, RiesgoConfig> = {
  critico: {
    label: 'Crítico',
    dot: 'bg-red-500',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-700',
    descripcion: 'Riesgo inminente. Requiere seguimiento cercano y protocolo de crisis activo.',
    orden: 4,
  },
  alto: {
    label: 'Alto',
    dot: 'bg-orange-500',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-700',
    descripcion: 'Sintomatología intensa o factores de riesgo presentes. Atención prioritaria.',
    orden: 3,
  },
  medio: {
    label: 'Medio',
    dot: 'bg-amber-400',
    badgeBg: 'bg-amber-400/20',
    badgeText: 'text-amber-700',
    descripcion: 'Evolución que requiere monitoreo regular.',
    orden: 2,
  },
  bajo: {
    label: 'Bajo',
    dot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-700',
    descripcion: 'Estable. Adherencia y evolución favorables.',
    orden: 1,
  },
  sin_evaluar: {
    label: 'Sin evaluar',
    dot: 'bg-noema-deep/25',
    badgeBg: 'bg-noema-deep/8',
    badgeText: 'text-foreground-muted',
    descripcion: 'Aún no has asignado un nivel de riesgo a este paciente.',
    orden: 0,
  },
};

export const NIVELES_RIESGO: NivelRiesgo[] = [
  'sin_evaluar',
  'bajo',
  'medio',
  'alto',
  'critico',
];

export function riesgoConfig(nivel: string | null | undefined): RiesgoConfig {
  return RIESGO[(nivel as NivelRiesgo) ?? 'sin_evaluar'] ?? RIESGO.sin_evaluar;
}
