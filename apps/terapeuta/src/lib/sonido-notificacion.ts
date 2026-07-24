/**
 * Sonidos de notificación generados con Web Audio API.
 *
 * No usamos archivos de audio a propósito: evitamos descargar assets, funciona
 * sin conexión y no añade peso al bundle. Son tonos cortos y discretos, acordes
 * al tono sobrio de NOEMA (nada estridente en una app de salud mental).
 */

export type SonidoNotificacion = 'suave' | 'campana' | 'silencioso';

/** Notas de cada sonido: [frecuencia Hz, inicio s, duración s]. */
const PATRONES: Record<Exclude<SonidoNotificacion, 'silencioso'>, [number, number, number][]> = {
  // Dos notas descendentes, suaves.
  suave: [
    [523.25, 0, 0.16],
    [392.0, 0.13, 0.22],
  ],
  // Campanada con armónico, decaimiento largo.
  campana: [
    [880, 0, 0.5],
    [1318.5, 0, 0.35],
  ],
};

let contexto: AudioContext | null = null;

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!contexto) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      contexto = new Ctor();
    }
    // Los navegadores suspenden el audio hasta que hay interacción del usuario.
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

/**
 * Reproduce el sonido indicado. Falla en silencio si el navegador lo bloquea
 * (por ejemplo, si aún no hubo interacción del usuario en la página).
 */
export function reproducirSonido(sonido: SonidoNotificacion): void {
  if (sonido === 'silencioso') return;
  const ctx = obtenerContexto();
  if (!ctx) return;

  const patron = PATRONES[sonido];
  if (!patron) return;

  const ahora = ctx.currentTime;

  for (const [frecuencia, inicio, duracion] of patron) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = frecuencia;

    // Envolvente suave: sube rápido y decae, para que no truene.
    const t0 = ahora + inicio;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duracion + 0.02);
  }
}

/**
 * ¿Estamos dentro del horario de "no molestar"?
 * Maneja rangos que cruzan la medianoche (ej. 21:00 → 08:00).
 */
export function enNoMolestar(desde: string, hasta: string, ahora = new Date()): boolean {
  const aMinutos = (hhmm: string) => {
    const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const actual = ahora.getHours() * 60 + ahora.getMinutes();
  const ini = aMinutos(desde);
  const fin = aMinutos(hasta);

  return ini <= fin ? actual >= ini && actual < fin : actual >= ini || actual < fin;
}
