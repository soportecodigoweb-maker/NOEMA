/**
 * Aviso de confidencialidad y privacidad del PACIENTE (requerimiento #9).
 *
 * Aparece al primer uso de la app. Enfatiza que el paciente es soberano sobre
 * su información: él decide qué comparte con su terapeuta y qué no.
 *
 * Versionado: si cambias el texto, sube VERSION_AVISO_PACIENTE — se volverá a
 * pedir aceptación a quienes aceptaron una versión anterior.
 *
 * NOTA LEGAL: borrador informado en LFPDPPP. Debe revisarlo un abogado antes
 * de producción.
 */

export const VERSION_AVISO_PACIENTE = '2026-07-v1';

export interface SeccionAviso {
  titulo: string;
  cuerpo: string;
}

export const AVISO_PRIVACIDAD_PACIENTE: SeccionAviso[] = [
  {
    titulo: 'Tú decides qué compartes',
    cuerpo:
      'En NOEMA, tú eres quien decide qué información ve tu terapeuta y qué información se queda solo para ti. Cada registro emocional y cada entrada de tu diario los puedes marcar como privados (solo tú), compartidos (tu terapeuta los ve) o para sesión.',
  },
  {
    titulo: 'Lo privado es inviolable',
    cuerpo:
      'Lo que marques como privado NUNCA llega al panel de tu terapeuta. Es tu espacio. Nadie más lo lee. Puedes cambiar de opinión sobre qué compartes en cualquier momento.',
  },
  {
    titulo: 'Cuidas tu propia información',
    cuerpo:
      'Al ser tú quien decide qué compartir, también eres responsable de cuidar la información que eliges mostrar. Piensa antes de compartir datos que consideres muy sensibles, y comparte a tu ritmo.',
  },
  {
    titulo: 'Tu terapeuta cuida lo que recibe',
    cuerpo:
      'Tu terapeuta se compromete a resguardar con confidencialidad la información que tú decidas compartir, y a usarla únicamente para acompañarte en tu proceso.',
  },
  {
    titulo: 'NOEMA no es una emergencia',
    cuerpo:
      'Esta app acompaña tu proceso entre sesiones, pero no sustituye la atención profesional ni los servicios de emergencia. Si vives una crisis, usa el botón de apoyo o contacta a las líneas de emergencia.',
  },
  {
    titulo: 'Puedes pausar o salir cuando quieras',
    cuerpo:
      'En cualquier momento puedes pausar la vinculación con tu terapeuta o cerrar tu cuenta. Tu información se maneja como tú decidas.',
  },
];

export const RESUMEN_ACEPTACION_PACIENTE =
  'He leído y entiendo el Aviso de Privacidad de NOEMA. Entiendo que yo decido qué información comparto con mi terapeuta y qué información se queda privada, y que soy responsable de cuidar lo que elijo compartir.';
