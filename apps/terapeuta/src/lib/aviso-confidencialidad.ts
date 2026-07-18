/**
 * Aviso de confidencialidad y responsabilidad compartida (requerimiento #12).
 *
 * Versionado: si cambias el texto, sube VERSION_AVISO. El sistema volverá a
 * pedir aceptación a quienes aceptaron una versión anterior.
 *
 * NOTA LEGAL: este texto es un borrador funcional basado en LFPDPPP (Ley
 * Federal de Protección de Datos Personales en Posesión de los Particulares)
 * y el espíritu de la NOM-004-SSA3-2012. DEBE ser revisado por un abogado
 * antes de producción real. Marcado como borrador en el reporte.
 */

export const VERSION_AVISO = '2026-07-v1';

export interface SeccionAviso {
  titulo: string;
  parrafos: string[];
}

export const AVISO_CONFIDENCIALIDAD_TERAPEUTA: SeccionAviso[] = [
  {
    titulo: 'Responsabilidad sobre la información del paciente',
    parrafos: [
      'Como profesional de la salud mental que utiliza NOEMA, reconoces que la información que recibes de tus pacientes —registros emocionales, entradas de diario compartidas, mensajes, respuestas a tareas, notas de sesión y cualquier archivo adjunto— constituye datos personales sensibles conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).',
      'Te comprometes a resguardar dicha información con estricta confidencialidad, a usarla únicamente para fines terapéuticos legítimos dentro de tu relación profesional con el paciente, y a no divulgarla a terceros salvo obligación legal o autorización expresa del paciente.',
    ],
  },
  {
    titulo: 'El paciente decide qué comparte',
    parrafos: [
      'NOEMA está diseñada bajo el principio de que el paciente es soberano sobre su información. El paciente decide, entrada por entrada, qué registros y contenidos comparte contigo y cuáles mantiene privados. NO tendrás acceso a la información que el paciente marque como privada.',
      'Entiendes que la ausencia de cierta información en tu panel puede deberse a la decisión del paciente de no compartirla, y que ello es un derecho suyo que debes respetar.',
    ],
  },
  {
    titulo: 'Expediente clínico y NOM-004',
    parrafos: [
      'Reconoces que el expediente clínico que construyas en NOEMA debe apegarse a lo dispuesto por la NOM-004-SSA3-2012 del expediente clínico, en lo que resulte aplicable a tu práctica. Las notas clínicas y datos registrados forman parte del expediente y no deben alterarse ni eliminarse de forma que comprometa su integridad y trazabilidad.',
      'Eres responsable de la veracidad y pertinencia de las notas clínicas que registres.',
    ],
  },
  {
    titulo: 'Alcance de NOEMA como herramienta',
    parrafos: [
      'NOEMA es una plataforma de acompañamiento y seguimiento entre sesiones. No sustituye el juicio clínico profesional ni constituye un servicio de atención de emergencias. Ante situaciones de riesgo, tú y el paciente deben recurrir a los servicios de emergencia y protocolos de crisis correspondientes.',
      'Las funciones asistidas por inteligencia artificial (resúmenes, sugerencias) son apoyos orientativos que requieren siempre tu revisión y validación profesional. NOEMA no se hace responsable de decisiones clínicas basadas exclusivamente en dichas sugerencias.',
    ],
  },
  {
    titulo: 'Manejo de datos y seguridad',
    parrafos: [
      'Te comprometes a mantener seguras tus credenciales de acceso, a no compartir tu cuenta y a cerrar sesión en dispositivos compartidos. Cualquier acceso realizado con tus credenciales se considerará efectuado por ti.',
      'En caso de terminar la relación terapéutica, conservarás o entregarás el expediente conforme a tus obligaciones profesionales y legales.',
    ],
  },
];

export const RESUMEN_ACEPTACION_TERAPEUTA =
  'He leído y acepto el Aviso de Confidencialidad y Responsabilidad Profesional de NOEMA. Me comprometo a resguardar la información de mis pacientes con estricta confidencialidad conforme a la LFPDPPP y la NOM-004-SSA3-2012, a respetar la decisión del paciente sobre qué información comparte, y a usar la plataforma únicamente para fines terapéuticos legítimos.';
