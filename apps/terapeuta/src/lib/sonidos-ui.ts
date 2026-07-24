/**
 * Sonidos de interacción de la interfaz (UI), generados con Web Audio API.
 *
 * A diferencia de un reproductor de música, estos son micro-sonidos que
 * acompañan las acciones del usuario: tocar un botón, escribir, activar un
 * interruptor, enviar algo. Están diseñados en el mismo estilo sobrio y
 * moderno que el sonido de notificación de mensajes (ver sonido-notificacion.ts):
 * senos suaves, muy cortos, con envolvente que no truena.
 *
 * Todo es sintetizado en tiempo real: cero archivos, funciona sin conexión y
 * no pesa en el bundle. Falla en silencio si el navegador bloquea el audio.
 */

export type SonidoUI = 'tap' | 'tecla' | 'toggleOn' | 'toggleOff' | 'enviar' | 'exito' | 'error';

let contexto: AudioContext | null = null;
let habilitado = true;

/** Permite silenciar globalmente (respeta la preferencia del usuario). */
export function establecerSonidosUI(activo: boolean): void {
  habilitado = activo;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('noema:sonidos-ui', activo ? '1' : '0');
    } catch {
      /* almacenamiento no disponible: ignoramos */
    }
  }
}

/** Lee la preferencia guardada (por defecto: activado). */
export function sonidosUIActivos(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem('noema:sonidos-ui') !== '0';
  } catch {
    return true;
  }
}

/** Sincroniza el interruptor interno con la preferencia guardada (sin reescribir). */
export function inicializarSonidosUI(): void {
  habilitado = sonidosUIActivos();
}

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!contexto) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      contexto = new Ctor();
    }
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

/** Una nota corta: [frecuencia Hz, inicio s, duración s, ganancia pico, tipo]. */
type Nota = {
  f: number;
  t: number;
  dur: number;
  vol?: number;
  tipo?: OscillatorType;
};

/**
 * Patrones de cada sonido. Volúmenes bajos a propósito: son acentos, no
 * protagonistas. La app de salud mental pide discreción.
 */
const PATRONES: Record<SonidoUI, Nota[]> = {
  // Toque de botón: un solo "tick" cálido y breve.
  tap: [{ f: 420, t: 0, dur: 0.055, vol: 0.05, tipo: 'triangle' }],

  // Tecla al escribir: casi imperceptible, muy agudo y muy corto.
  tecla: [{ f: 660, t: 0, dur: 0.03, vol: 0.025, tipo: 'sine' }],

  // Interruptor encendido: dos notas ascendentes.
  toggleOn: [
    { f: 523.25, t: 0, dur: 0.06, vol: 0.05, tipo: 'sine' },
    { f: 783.99, t: 0.05, dur: 0.09, vol: 0.05, tipo: 'sine' },
  ],

  // Interruptor apagado: dos notas descendentes.
  toggleOff: [
    { f: 587.33, t: 0, dur: 0.06, vol: 0.05, tipo: 'sine' },
    { f: 392.0, t: 0.05, dur: 0.09, vol: 0.05, tipo: 'sine' },
  ],

  // Enviar / confirmar acción: pequeño gesto ascendente y ligero.
  enviar: [
    { f: 587.33, t: 0, dur: 0.06, vol: 0.055, tipo: 'sine' },
    { f: 880.0, t: 0.06, dur: 0.12, vol: 0.055, tipo: 'sine' },
  ],

  // Éxito: arpegio corto y agradable de tres notas.
  exito: [
    { f: 523.25, t: 0, dur: 0.08, vol: 0.05, tipo: 'sine' },
    { f: 659.25, t: 0.07, dur: 0.08, vol: 0.05, tipo: 'sine' },
    { f: 1046.5, t: 0.14, dur: 0.16, vol: 0.05, tipo: 'sine' },
  ],

  // Error suave: dos notas bajas, sin alarmar.
  error: [
    { f: 311.13, t: 0, dur: 0.1, vol: 0.05, tipo: 'triangle' },
    { f: 246.94, t: 0.09, dur: 0.16, vol: 0.05, tipo: 'triangle' },
  ],
};

/**
 * Reproduce un micro-sonido de UI. Silencioso si el usuario lo desactivó o si
 * el navegador aún no permite audio (falta de interacción previa).
 */
export function sonarUI(sonido: SonidoUI): void {
  if (!habilitado) return;
  const ctx = obtenerContexto();
  if (!ctx) return;

  const patron = PATRONES[sonido];
  if (!patron) return;

  const ahora = ctx.currentTime;

  for (const nota of patron) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = nota.tipo ?? 'sine';
    osc.frequency.value = nota.f;

    const pico = nota.vol ?? 0.05;
    const t0 = ahora + nota.t;
    // Envolvente rápida de ataque y decaimiento suave para que no truene.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(pico, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + nota.dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + nota.dur + 0.02);
  }
}
