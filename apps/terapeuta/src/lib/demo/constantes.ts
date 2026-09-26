/**
 * Constantes del modo demo (sandbox público + video demo).
 *
 * El demo NO tiene cuenta maestra: cada visitante recibe su propia pareja de
 * cuentas (psicóloga demo + paciente demo) creadas en la base al entrar, y las
 * dos sesiones viven a la vez en cookies distintas para que el panel de la
 * psicóloga y la app del paciente puedan verse al mismo tiempo (ventana de
 * teléfono, video con laptop y teléfono).
 */

/** Cookie httpOnly con el id del visitante demo (uuid). */
export const COOKIE_DEMO = 'noema_demo';
/** Cookie legible por el navegador: "1" cuando hay demo activo (para la UI). */
export const COOKIE_DEMO_UI = 'noema_demo_ui';
/** Duración de las cookies del demo (la base borra visitantes a las 20 h). */
export const DEMO_MAX_AGE_SEG = 20 * 60 * 60;

/** Clave de almacenamiento de la sesión normal (psicóloga en el demo). */
export const STORAGE_KEY_AUTH = 'sb-noema-auth';
/** Clave de la sesión del paciente demo (solo se usa en rutas /paciente). */
export const STORAGE_KEY_DEMO_PACIENTE = 'sb-noema-dpac';

export type RolDemo = 'psicologo' | 'paciente';

/** ¿La ruta pertenece al lado del paciente? */
export function esRutaPaciente(pathname: string): boolean {
  return (
    pathname === '/paciente' || pathname.startsWith('/paciente/') || pathname === '/aviso-paciente'
  );
}

/** Inicio de cada rol en el sandbox. */
export const INICIO_ROL: Record<RolDemo, string> = {
  psicologo: '/inicio',
  paciente: '/paciente',
};

/** Mensajes entre el reproductor (o la ventana de teléfono) y la app embebida. */
export const MSG = {
  /** padre → iframe: ejecutar un guion de acciones */
  guion: 'noema-demo:guion',
  /** iframe → padre: el guion terminó */
  listo: 'noema-demo:listo',
  /** iframe → padre: agregar un chip de subpaso */
  chip: 'noema-demo:chip',
  /** iframe → padre: la app embebida ya está lista para recibir guiones */
  hola: 'noema-demo:hola',
  /** padre → iframe: cancelar lo que esté corriendo */
  cancelar: 'noema-demo:cancelar',
} as const;
