/**
 * Tipos del motor del demo. Un "guion" es una lista de acciones que la app
 * ejecuta sola sobre su propia interfaz real (navegar, resaltar, hacer clic,
 * escribir, desplazarse), igual que en el demo de Operana.
 *
 * Selectores: un texto que empieza con "@" es un ancla `data-demo="..."`;
 * cualquier otro es un selector CSS normal.
 */

export type Accion =
  /** Ir a una ruta real de la app y esperar a que aparezca un selector (o el main). */
  | { tipo: 'navegar'; ruta: string; esperar?: string; msMax?: number }
  /** Pausa. */
  | { tipo: 'esperar'; ms: number }
  /** Oscurecer y enmarcar un bloque (null quita el marco). */
  | { tipo: 'resaltar'; sel: string | null; desplazar?: boolean }
  /** Desplazamiento continuo lento (página o contenedor) durante ms. */
  | { tipo: 'scrollLento'; sel?: string; ms: number; hasta?: 'fin' | number; volver?: boolean }
  /** Ir bloque por bloque: enmarca cada selector, se detiene msPorBloque. */
  | { tipo: 'bloques'; sels: string[]; msPorBloque: number }
  /** Mover el cursor al elemento y hacer clic real. */
  | { tipo: 'clic'; sel: string; msMax?: number }
  /** Escribir letra por letra en un input/textarea/contenteditable real. */
  | { tipo: 'escribir'; sel: string; texto: string; msPorLetra?: number }
  /** Animar los números dentro de un bloque (contadores que suben). */
  | { tipo: 'contadores'; sel?: string; ms?: number }
  /** Volver a dibujar las gráficas de un bloque (barras crecen, líneas se trazan). */
  | { tipo: 'graficas'; sel?: string }
  /** Abrir o cerrar el menú lateral (móvil). */
  | { tipo: 'menu'; abrir: boolean }
  /** Mover el cursor a un punto o elemento sin hacer clic. */
  | { tipo: 'cursor'; sel?: string; x?: number; y?: number; ms?: number }
  /** Ventana de teléfono flotante con la app del otro rol corriendo sola. */
  | {
      tipo: 'telefono';
      ruta: string;
      rotulo: string;
      acciones: Accion[];
      /** Si se da, cierra la ventana al terminar; si no, se queda abierta. */
      cerrarAlTerminar?: boolean;
    }
  | { tipo: 'cerrarTelefono' }
  /** Chip de subpaso (en el video aparece bajo el marco). */
  | { tipo: 'chip'; texto: string }
  /** Evento libre (window.dispatchEvent(new CustomEvent(nombre, {detail}))). */
  | { tipo: 'evento'; nombre: string; detalle?: unknown }
  /** Recargar los datos del servidor (router.refresh). */
  | { tipo: 'refrescar' };

/** Un paso del recorrido guiado del sandbox. */
export interface PasoRecorrido {
  id: string;
  /** Texto pequeño en mayúsculas, p. ej. "PRIVACIDAD". */
  etiqueta: string;
  titulo: string;
  texto: string;
  /** Ruta en la que sucede el paso (se navega si no estamos ahí). */
  ruta: string;
  /** Duración estimada del paso (para el cronómetro y el avance automático). */
  ms: number;
  acciones: Accion[];
  /** Lado preferido de la tarjeta narradora. */
  tarjeta?: 'izquierda' | 'derecha';
  /** Paso de cierre: al terminar deja la app libre y la tarjeta abierta. */
  cierre?: boolean;
}

/** Recorrido completo de un rol. */
export interface Recorrido {
  rol: 'psicologo' | 'paciente';
  pasos: PasoRecorrido[];
}

/** Una diapositiva del video demo. */
export interface Diapositiva {
  id: string;
  etiqueta: string;
  titulo: string;
  parrafo: string;
  /** Qué marcos se muestran. */
  marco: 'ninguno' | 'laptop' | 'telefono' | 'laptop-telefono' | 'dos-telefonos' | 'tarjeta';
  /** Ruta que carga la laptop (panel de la psicóloga) y su guion. */
  laptop?: { ruta: string; guion?: Accion[]; repetir?: boolean };
  /** Ruta que carga el teléfono (app del paciente) y su guion. */
  telefono?: { ruta: string; guion?: Accion[]; repetir?: boolean };
  /** Segundo teléfono (diapositiva de dos teléfonos). */
  telefono2?: { ruta: string; guion?: Accion[]; repetir?: boolean };
  /** Chips de subpaso que aparecen escalonados bajo el marco. */
  chips?: string[];
  /** Duración de la diapositiva. */
  ms: number;
  /** Diapositiva especial. */
  especial?: 'portada' | 'precio' | 'cierre';
  /** Para "precio": el número al que sube el contador y el texto de abajo. */
  precio?: { monto: number; unidad: string; nota: string };
}

export interface VideoDemo {
  rol: 'psicologo' | 'paciente';
  diapositivas: Diapositiva[];
}
