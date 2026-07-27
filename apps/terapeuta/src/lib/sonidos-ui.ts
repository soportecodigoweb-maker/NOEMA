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

/** Volumen global de los sonidos de UI (0 a 1). Por defecto: máximo. */
let volumen = 1;

/** Ajusta el volumen global de los sonidos de UI (0 a 1) y lo guarda. */
export function establecerVolumenUI(v: number): void {
  volumen = Math.max(0, Math.min(1, v));
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('noema:volumen-ui', String(volumen));
    } catch {
      /* almacenamiento no disponible: ignoramos */
    }
  }
}

/** Lee el volumen guardado (por defecto: 1 = máximo). */
export function volumenUI(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const v = window.localStorage.getItem('noema:volumen-ui');
    if (v === null) return 1;
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  } catch {
    return 1;
  }
}

/** Sincroniza el interruptor y el volumen internos con la preferencia guardada. */
export function inicializarSonidosUI(): void {
  habilitado = sonidosUIActivos();
  volumen = volumenUI();
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
  // Toque de botón: "tick" moderno y redondo (senos, nada chiptune).
  // Un golpe grave breve con un armónico más alto muy sutil.
  tap: [
    { f: 330, t: 0, dur: 0.06, vol: 0.18, tipo: 'sine' },
    { f: 210, t: 0.012, dur: 0.07, vol: 0.13, tipo: 'sine' },
  ],

  // Tecla (ya no se usa por defecto; se conserva por compatibilidad).
  tecla: [{ f: 320, t: 0, dur: 0.03, vol: 0.06, tipo: 'sine' }],

  // Interruptor encendido: dos notas ascendentes.
  toggleOn: [
    { f: 523.25, t: 0, dur: 0.07, vol: 0.15, tipo: 'sine' },
    { f: 783.99, t: 0.05, dur: 0.1, vol: 0.15, tipo: 'sine' },
  ],

  // Interruptor apagado: dos notas descendentes.
  toggleOff: [
    { f: 587.33, t: 0, dur: 0.07, vol: 0.15, tipo: 'sine' },
    { f: 392.0, t: 0.05, dur: 0.1, vol: 0.15, tipo: 'sine' },
  ],

  // Enviar / confirmar acción: pequeño gesto ascendente y ligero.
  enviar: [
    { f: 587.33, t: 0, dur: 0.07, vol: 0.17, tipo: 'sine' },
    { f: 880.0, t: 0.06, dur: 0.13, vol: 0.17, tipo: 'sine' },
  ],

  // Éxito: arpegio corto y agradable de tres notas.
  exito: [
    { f: 523.25, t: 0, dur: 0.09, vol: 0.15, tipo: 'sine' },
    { f: 659.25, t: 0.07, dur: 0.09, vol: 0.15, tipo: 'sine' },
    { f: 1046.5, t: 0.14, dur: 0.17, vol: 0.15, tipo: 'sine' },
  ],

  // Error suave: dos notas bajas, sin alarmar.
  error: [
    { f: 311.13, t: 0, dur: 0.11, vol: 0.14, tipo: 'sine' },
    { f: 246.94, t: 0.09, dur: 0.17, vol: 0.14, tipo: 'sine' },
  ],
};

/**
 * Reproduce un micro-sonido de UI. Silencioso si el usuario lo desactivó o si
 * el navegador aún no permite audio (falta de interacción previa).
 */
export function sonarUI(sonido: SonidoUI): void {
  if (!habilitado || volumen <= 0) return;
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

    // Volumen base ×2.4 (sonido más alto) × preferencia del usuario (0–1).
    const pico = Math.min(0.6, (nota.vol ?? 0.05) * 2.4 * volumen);
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
