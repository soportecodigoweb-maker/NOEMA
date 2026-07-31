/**
 * Aviso de privacidad del PACIENTE en la web (#8). Espejo del de la app móvil.
 * Al entrar por primera vez, el paciente debe leerlo y aceptarlo.
 *
 * ⚠️ Borrador legal — revisar con abogado antes de producción.
 */
export const VERSION_AVISO_PACIENTE = '2026-07-v3';

/**
 * Puntos de consentimiento que el paciente debe marcar uno por uno (con
 * palomita) antes de poder aceptar: lo que acepta, lo que envía, lo que permite
 * que vea el terapeuta y lo que se compromete a cuidar.
 */
export const PUNTOS_CONSENTIMIENTO_PACIENTE: Array<{ id: string; texto: string }> = [
  {
    id: 'apoyo',
    texto:
      'Entiendo que NOEMA es una herramienta de apoyo: no realiza diagnósticos ni sustituye la atención psicológica profesional.',
  },
  {
    id: 'privacidad',
    texto:
      'Acepto el aviso de privacidad y que mis datos se traten conforme a la LFPDPPP, con estricta confidencialidad.',
  },
  {
    id: 'yo-decido',
    texto:
      'Entiendo que yo decido qué información comparto con mi terapeuta y qué queda privado; lo privado es inviolable.',
  },
  {
    id: 'solo-terapeuta',
    texto:
      'Autorizo que la información que decida compartir sea vista únicamente por mi terapeuta autorizado, y por nadie más.',
  },
  {
    id: 'responsable',
    texto:
      'Me comprometo a cuidar mis credenciales de acceso y a usar NOEMA de forma responsable.',
  },
];

export const AVISO_PRIVACIDAD_PACIENTE: Array<{ titulo: string; cuerpo: string }> = [
  {
    titulo: 'Tu información es completamente confidencial',
    cuerpo:
      'Toda tu información personal y clínica dentro de NOEMA —tus registros emocionales, tu diario, tus mensajes, tus tareas y cualquier dato que ingreses— es tratada con estricta confidencialidad conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
  },
  {
    titulo: 'Tus datos no se comparten con nadie más',
    cuerpo:
      'Tu información no se venderá, cederá ni compartirá con ninguna entidad, empresa, aseguradora, autoridad comercial ni tercero por ningún motivo, salvo obligación legal ineludible o que tú lo autorices expresamente. La única comunicación de tu información clínica ocurre entre tú y tu terapeuta.',
  },
  {
    titulo: 'Solo tú y tu terapeuta',
    cuerpo:
      'NOEMA existe para conectar únicamente a un paciente con su terapeuta. Nadie más tiene acceso a tu proceso. La plataforma no usa tu información clínica para publicidad ni con fines distintos a tu acompañamiento terapéutico.',
  },
  {
    titulo: 'Tú decides qué compartes',
    cuerpo:
      'Tú eres quien decide qué información ve tu terapeuta y qué se queda solo para ti. Cada registro y cada entrada de diario los marcas como privados, compartidos o para sesión, siempre que la app lo permita.',
  },
  {
    titulo: 'Lo privado es inviolable',
    cuerpo:
      'Lo que marques como privado NUNCA llega al panel de tu terapeuta ni a nadie. Es tu espacio. Puedes cambiar de opinión sobre qué compartes en cualquier momento.',
  },
  {
    titulo: 'Tu terapeuta cuida lo que recibe',
    cuerpo:
      'Tu terapeuta se compromete a resguardar con confidencialidad la información que decidas compartir y a usarla solo para acompañarte en tu proceso. NOEMA le exige aceptar ese compromiso por escrito.',
  },
  {
    titulo: 'NOEMA no es una emergencia',
    cuerpo:
      'Esta plataforma acompaña tu proceso, pero no sustituye la atención profesional ni los servicios de emergencia. Ante una crisis, usa el botón de apoyo o las líneas de emergencia.',
  },
  {
    titulo: 'Términos de uso y control de tu cuenta',
    cuerpo:
      'Al aceptar, reconoces estos términos de uso y confirmas que la información que ingreses es veraz. En cualquier momento puedes pausar la vinculación con tu terapeuta o eliminar tu cuenta.',
  },
  {
    titulo: 'Si eliminas tu cuenta',
    cuerpo:
      'Puedes eliminar tu cuenta cuando quieras. Al hacerlo, tu información deja de ser accesible para tu terapeuta y para ti de inmediato, y no podrás volver a iniciar sesión. Por obligaciones legales aplicables, cierta información se conserva bloqueada —sin que nadie la consulte— durante el periodo que marque la ley, y después se elimina de forma definitiva.',
  },
];

export const RESUMEN_ACEPTACION_PACIENTE =
  'He leído y acepto el Aviso de Confidencialidad y los Términos de Uso de NOEMA. Entiendo que mi información clínica es completamente confidencial y no se compartirá con ninguna entidad por ningún motivo, que la comunicación es solo entre mi terapeuta y yo, y que yo decido qué comparto y qué mantengo privado.';
