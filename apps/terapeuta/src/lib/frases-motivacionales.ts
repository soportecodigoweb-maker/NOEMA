/**
 * Frases motivacionales de NOEMA.
 *
 * Una lista grande, organizada por "familia" del estado que presenta el
 * paciente, más un algoritmo que elige una frase acorde a su cuadro reciente.
 * TODO es algorítmico (sin IA): se elige por familia dominante + una semilla
 * diaria para que rote y no se repita el mismo día.
 *
 * Tono: cálido, validante, sin diagnosticar ni prometer. Nunca minimiza lo que
 * siente la persona; acompaña.
 */

export type FamiliaFrase = 'tranquilo' | 'ansioso' | 'triste' | 'cansado' | 'feliz' | 'general';

const FRASES: Record<FamiliaFrase, string[]> = {
  // Cuando predomina la calma: sostener y agradecer el momento.
  tranquilo: [
    'La calma que sientes hoy también es parte de tu proceso. Disfrútala.',
    'Estar en paz no es la meta final, es una señal de que vas construyendo algo bueno.',
    'Este momento de equilibrio lo lograste tú. Reconócelo.',
    'Respira y quédate un instante más en esta tranquilidad. Te la ganaste.',
    'La serenidad también se practica. Hoy la estás practicando bien.',
    'Guarda cómo se siente esta calma: será tu brújula en días más movidos.',
    'No todo tiene que resolverse hoy. Descansar en la calma también es avanzar.',
    'Que la paz de hoy te recuerde que eres capaz de encontrarla.',
    'Estás justo donde necesitas estar. Nada que forzar.',
    'La quietud de hoy es tierra fértil para lo que viene.',
    'Agradece a la versión de ti que hizo posible esta calma.',
    'Un día en paz es un logro silencioso. Cuenta igual.',
    'Deja que este bienestar se asiente sin apuro.',
    'Hoy el mundo puede esperar. Quédate contigo un momento.',
    'La calma no es ausencia de problemas, es tu manera de sostenerte entre ellos.',
    'Tu sistema nervioso también merece días tranquilos como este.',
    'Nota lo que hiciste distinto para sentirte así. Ahí hay una pista valiosa.',
    'Estar bien no necesita justificación. Permítetelo.',
  ],
  // Ansiedad/preocupación: aterrizar, respirar, reducir el ruido.
  ansioso: [
    'Estás a salvo en este momento. Respira lento: inhala 4, sostén 4, exhala 6.',
    'La ansiedad exagera el futuro. Vuelve al ahora: ¿qué necesitas en este minuto?',
    'No tienes que resolver todo hoy. Un paso pequeño ya es suficiente.',
    'Tus pensamientos no son órdenes. Puedes observarlos sin obedecerlos.',
    'Esto que sientes es intenso, pero también es temporal. Va a bajar.',
    'Pon los pies en el piso y siente el apoyo. Estás aquí, estás sostenido.',
    'La preocupación intenta protegerte, pero hoy puedes agradecerle y soltarla un poco.',
    'Nombrar lo que sientes ya le quita fuerza. Escríbelo si te ayuda.',
    'No estás exagerando. Y también: puedes cuidarte ahora mismo.',
    'Una cosa a la vez. Elige solo la siguiente, no todas juntas.',
    'Tu respiración es un ancla que siempre traes contigo. Úsala.',
    'La mente acelerada miente sobre la urgencia. Casi nada es tan inmediato como parece.',
    'Date permiso de hacerlo imperfecto. Terminar vale más que perfecto.',
    'Si el cuerpo está tenso, suelta los hombros y afloja la mandíbula. Empieza por ahí.',
    'No tienes que tener todas las respuestas para estar bien hoy.',
    'Lo difícil también pasa. Ya has cruzado momentos así antes.',
    'Baja el ritmo. No hay premio por sufrir más rápido.',
    'Estás haciendo lo mejor que puedes con lo que tienes hoy, y es suficiente.',
    'Cierra los ojos 10 segundos. Nada malo pasará por darte esa pausa.',
    'La calma no llega peleando con la ansiedad, sino haciéndole espacio.',
  ],
  // Tristeza/duelo/vacío: validar y acompañar sin apurar.
  triste: [
    'Está bien no estar bien. Tu tristeza también merece un lugar.',
    'No tienes que ser fuerte todo el tiempo. Hoy puedes solo estar.',
    'Sentir esto no te hace débil; te hace humano.',
    'Los días grises también terminan. No estás solo en este.',
    'Permítete sentir sin juzgarte. Lo que sientes tiene sentido.',
    'Un paso pequeño hoy ya es mucho. No te exijas de más.',
    'Tu valor no depende de cómo te sientes hoy.',
    'La tristeza es una visita, no tu casa. Va a irse a su tiempo.',
    'Sé contigo tan amable como serías con alguien que quieres.',
    'No tienes que explicarle a nadie por qué te sientes así.',
    'Llorar también limpia. Si necesitas, hazlo sin culpa.',
    'Hoy basta con respirar y sostenerte. Mañana es otra cosa.',
    'Lo que duele importa porque tú importas.',
    'Date el permiso de ir despacio. El proceso no es una carrera.',
    'Aun en lo gris, sigues aquí. Eso ya es un acto de fuerza.',
    'No estás roto; estás atravesando algo. Y lo estás atravesando.',
    'Busca una cosa pequeña que te dé calorcito hoy: una cobija, una canción, un té.',
    'Tu terapeuta y NOEMA están de tu lado, incluso en los días difíciles.',
    'Está bien pedir ayuda. No tienes que cargar esto en silencio.',
    'Mañana no tiene que ser perfecto. Solo un poco más suave.',
  ],
  // Cansancio/agotamiento: permiso para descansar, bajar exigencia.
  cansado: [
    'Descansar no es rendirse. Es parte de seguir.',
    'Tu cuerpo te está pidiendo una pausa. Escúchalo sin culpa.',
    'No tienes que dar el 100% hoy. El 40% también cuenta.',
    'Estar cansado es información, no un defecto. ¿Qué necesitas soltar?',
    'Hoy la meta puede ser simplemente cuidarte.',
    'Menos es más cuando la energía está baja. Prioriza una sola cosa.',
    'Permítete un descanso real, sin la culpa de estar “perdiendo el tiempo”.',
    'Recargar también es productivo. Nadie rinde en vacío.',
    'Baja el listón hoy. Mañana, con más energía, lo retomas.',
    'Dormir, comer y respirar cuentan como avances cuando estás agotado.',
    'No te compares con tus días de más energía. Hoy es hoy.',
    'Un descanso a tiempo evita un desgaste mayor. Tómalo.',
    'Tu ritmo es válido aunque sea más lento hoy.',
    'Suelta lo que puedas posponer. No todo es para ya.',
    'Cuidarte hoy es una inversión, no una pérdida.',
    'El agotamiento pide ternura, no exigencia. Sé suave contigo.',
    'Haz una pausa antes de vaciarte del todo. Te lo mereces.',
    'Tu bienestar vale más que cualquier pendiente de hoy.',
  ],
  // Estados positivos: reforzar, celebrar, dejar huella de lo que funciona.
  feliz: [
    '¡Qué bueno leerte así! Disfruta este momento a fondo.',
    'Guarda esta sensación: es una prueba de que los buenos días existen.',
    'Celebra lo que estás sintiendo. Te lo has trabajado.',
    'La alegría también se cultiva, y hoy diste en el clavo.',
    'Nota qué te trajo hasta aquí; es una receta que puedes repetir.',
    'Compartir lo bueno lo hace más grande. Cuéntaselo a alguien.',
    'Este impulso es tuyo. Úsalo para algo que te importe.',
    'Días como hoy también son parte de tu historia. Anótalos.',
    'Sonríe sin apuro. Te lo mereces.',
    'Que esta energía te acompañe y te recuerde de lo que eres capaz.',
    'Lo estás haciendo bien, y hoy tu ánimo lo confirma.',
    'Aprovecha este buen momento para hacer algo que ames.',
    'Tu bienestar de hoy inspira. Empezando por ti.',
    'Gracias por registrar también lo bueno: eso también es tu proceso.',
    'Deja que la alegría de hoy sea un ancla para los días retadores.',
    'Estás floreciendo. Riega eso que te hace bien.',
    'Reconoce tu parte en este buen día. No fue casualidad.',
    'Que lo bueno de hoy te dure y se multiplique.',
  ],
  // Sin datos suficientes o mezcla: aliento general para registrar/cuidarse.
  general: [
    'Cada emoción que registras es un paso para conocerte mejor.',
    'No hay emociones correctas o incorrectas: todas te dicen algo.',
    'Registrarte hoy es un acto de cuidado hacia ti.',
    'Pequeños pasos, todos los días, construyen grandes cambios.',
    'Estás aquí, y eso ya dice mucho de ti.',
    'Tu proceso es tuyo y va a tu ritmo. Está bien así.',
    'Escucharte es el primer paso para cuidarte.',
    'Lo que sientes importa, sea lo que sea.',
    'Hoy es un buen día para ser amable contigo.',
    'Anotar cómo te sientes le da a tu terapeuta una mejor foto para acompañarte.',
    'No tienes que tenerlo todo claro para avanzar.',
    'Confía en el proceso: cada registro suma.',
    'Eres más fuerte de lo que crees en tus días difíciles.',
    'Tu bienestar merece tiempo y atención. Empieza hoy.',
    'Un momento para ti puede cambiar todo el día.',
    'Sigues aquí, sigues intentándolo. Eso cuenta.',
  ],
};

/** Todas las familias con al menos una frase, útil para validaciones. */
export const FAMILIAS_FRASE = Object.keys(FRASES) as FamiliaFrase[];

/**
 * Elige una frase de una familia. Usa una semilla (p. ej. el día del año) para
 * rotar de forma estable: la misma persona ve la misma frase todo el día, pero
 * cambia de un día a otro.
 */
export function fraseDeFamilia(familia: FamiliaFrase, semilla: number): string {
  const lista = FRASES[familia]?.length ? FRASES[familia] : FRASES.general;
  const i = ((semilla % lista.length) + lista.length) % lista.length;
  return lista[i]!;
}

/**
 * A partir del conteo de registros por familia en días recientes, decide qué
 * "cuadro" predomina y devuelve la frase acorde.
 *
 * Reglas:
 *  - Sin datos → aliento general que invita a registrarse.
 *  - Familia dominante = la más frecuente entre las difíciles (ansioso, triste,
 *    cansado) si aparecen; si no, la más frecuente en general.
 *  Priorizamos acompañar lo difícil cuando está presente.
 */
export function elegirFraseMotivacional(
  conteoPorFamilia: Partial<Record<FamiliaFrase, number>>,
  semilla: number,
): { familia: FamiliaFrase; frase: string } {
  const total = Object.values(conteoPorFamilia).reduce((s, n) => s + (n ?? 0), 0);
  if (!total) {
    return { familia: 'general', frase: fraseDeFamilia('general', semilla) };
  }

  const dificiles: FamiliaFrase[] = ['ansioso', 'triste', 'cansado'];
  const difMax = dificiles
    .map((f) => ({ f, n: conteoPorFamilia[f] ?? 0 }))
    .sort((a, b) => b.n - a.n)[0];

  if (difMax && difMax.n > 0) {
    return { familia: difMax.f, frase: fraseDeFamilia(difMax.f, semilla) };
  }

  // Si no hay difíciles, tomar la familia más frecuente (positiva/tranquila).
  const dominante = (Object.entries(conteoPorFamilia) as [FamiliaFrase, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'general';
  return { familia: dominante, frase: fraseDeFamilia(dominante, semilla) };
}

/** Día del año (1..366) como semilla estable por día. */
export function semillaDelDia(fecha = new Date()): number {
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  const diff = fecha.getTime() - inicio.getTime();
  return Math.floor(diff / 86400000);
}
