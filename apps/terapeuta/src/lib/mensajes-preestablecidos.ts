/**
 * Mensajes preestablecidos para que el terapeuta envíe rápido (req. terapeuta #2).
 *
 * Son plantillas editables: al elegir una, se inserta en el composer y el
 * terapeuta puede ajustarla antes de enviar. Funcionales, no genéricas.
 *
 * NOTA: la opción "apoyarse con IA" (sugerir/redactar con IA) se habilitará
 * cuando se configure la cuenta de OpenAI/Anthropic (pendiente de decisión).
 */
export interface MensajePreestablecido {
  categoria: string;
  texto: string;
}

export const MENSAJES_PREESTABLECIDOS: MensajePreestablecido[] = [
  {
    categoria: 'Seguimiento',
    texto: '¿Cómo has estado desde nuestra última sesión? Cuéntame lo que quieras.',
  },
  {
    categoria: 'Seguimiento',
    texto: 'Vi tus registros de esta semana. ¿Hay algo de eso que te gustaría revisar juntos en la próxima sesión?',
  },
  {
    categoria: 'Aliento',
    texto: 'Reconozco el esfuerzo que estás poniendo. Aparecer, incluso en días difíciles, es parte importante del proceso.',
  },
  {
    categoria: 'Tarea',
    texto: 'Te dejé un nuevo ejercicio. Hazlo a tu ritmo y sin presión; lo revisamos en sesión.',
  },
  {
    categoria: 'Recordatorio de sesión',
    texto: 'Te recuerdo nuestra sesión. Si necesitas reagendar, avísame con tiempo y lo acomodamos.',
  },
  {
    categoria: 'Cuidado',
    texto: 'Recuerda que esta vía es para comunicación entre sesiones, no para emergencias. Si vives una crisis, usa tus recursos de apoyo o las líneas de emergencia.',
  },
  {
    categoria: 'Cierre',
    texto: 'Gracias por compartir. Lo tomo en cuenta y lo trabajamos en nuestra próxima sesión.',
  },
];
