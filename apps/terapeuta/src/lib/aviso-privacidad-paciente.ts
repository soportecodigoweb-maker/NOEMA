/**
 * Aviso de privacidad del PACIENTE en la web (#8). Espejo del de la app móvil.
 * Al entrar por primera vez, el paciente debe leerlo y aceptarlo.
 *
 * ⚠️ Borrador legal — revisar con abogado antes de producción.
 */
export const VERSION_AVISO_PACIENTE = '2026-07-v1';

export const AVISO_PRIVACIDAD_PACIENTE: Array<{ titulo: string; cuerpo: string }> = [
  {
    titulo: 'Tú decides qué compartes',
    cuerpo:
      'En NOEMA, tú eres quien decide qué información ve tu terapeuta y qué se queda solo para ti. Cada registro y cada entrada de diario los marcas como privados, compartidos o para sesión.',
  },
  {
    titulo: 'Lo privado es inviolable',
    cuerpo:
      'Lo que marques como privado NUNCA llega al panel de tu terapeuta. Es tu espacio. Puedes cambiar de opinión sobre qué compartes en cualquier momento.',
  },
  {
    titulo: 'Cuidas tu propia información',
    cuerpo:
      'Al ser tú quien decide qué compartir, también eres responsable de cuidar lo que eliges mostrar. Comparte a tu ritmo.',
  },
  {
    titulo: 'Tu terapeuta cuida lo que recibe',
    cuerpo:
      'Tu terapeuta se compromete a resguardar con confidencialidad la información que decidas compartir y a usarla solo para acompañarte en tu proceso.',
  },
  {
    titulo: 'NOEMA no es una emergencia',
    cuerpo:
      'Esta plataforma acompaña tu proceso, pero no sustituye la atención profesional ni los servicios de emergencia. Ante una crisis, usa el botón de apoyo o las líneas de emergencia.',
  },
  {
    titulo: 'Puedes pausar o salir cuando quieras',
    cuerpo:
      'En cualquier momento puedes pausar la vinculación con tu terapeuta o cerrar tu cuenta.',
  },
];

export const RESUMEN_ACEPTACION_PACIENTE =
  'He leído y entiendo el Aviso de Privacidad de NOEMA. Entiendo que yo decido qué información comparto con mi terapeuta y qué queda privado, y que soy responsable de cuidar lo que elijo compartir.';
