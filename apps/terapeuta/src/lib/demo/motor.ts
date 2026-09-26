/**
 * Motor del demo: ejecuta guiones (listas de acciones) sobre la interfaz real.
 *
 * No sabe de React: recibe un "contexto" con las funciones que la capa visual
 * le presta (navegar, mover el cursor, resaltar, abrir el teléfono). Así el
 * mismo motor sirve para el recorrido del sandbox, para la app embebida en el
 * reproductor de video y para la ventana de teléfono.
 */
import type { Accion } from './tipos';

export interface ContextoMotor {
  navegar: (ruta: string) => void;
  refrescar: () => void;
  pathname: () => string;
  resaltar: (sel: string | null, desplazar?: boolean) => void;
  /** Coordenadas de viewport. `clic` dibuja la onda del clic. */
  cursor: (x: number, y: number, clic?: boolean) => void;
  chip: (texto: string) => void;
  telefono: (cfg: { ruta: string; rotulo: string; acciones: Accion[] }) => Promise<void>;
  cerrarTelefono: () => void;
  menu: (abrir: boolean) => void;
}

export class Cancelado extends Error {
  constructor() {
    super('demo cancelado');
    this.name = 'Cancelado';
  }
}

/**
 * "@clave" → [data-demo="clave"]; "@clave button" → [data-demo="clave"] button.
 * Lo que no empieza con "@" es CSS tal cual.
 */
export function selector(sel: string): string {
  if (!sel.startsWith('@')) return sel;
  const [clave, ...resto] = sel.slice(1).split(' ');
  return `[data-demo="${clave}"]${resto.length ? ' ' + resto.join(' ') : ''}`;
}

export function buscar(sel: string): HTMLElement | null {
  try {
    return document.querySelector<HTMLElement>(selector(sel));
  } catch {
    return null;
  }
}

export function dormir(ms: number, señal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (señal?.aborted) return reject(new Cancelado());
    const t = window.setTimeout(() => {
      señal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new Cancelado());
    };
    señal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Espera a que exista (y tenga tamaño) un selector. */
export async function esperarSelector(
  sel: string,
  msMax = 6000,
  señal?: AbortSignal,
): Promise<HTMLElement | null> {
  const inicio = performance.now();
  while (performance.now() - inicio < msMax) {
    const el = buscar(sel);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) return el;
    }
    await dormir(80, señal);
  }
  return buscar(sel);
}

const facil = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const suave = (t: number) => 1 - Math.pow(1 - t, 3);

/** Anima con requestAnimationFrame durante ms; f recibe el progreso 0..1. */
export function animar(ms: number, f: (p: number) => void, señal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const inicio = performance.now();
    let raf = 0;
    const paso = (ahora: number) => {
      if (señal?.aborted) return reject(new Cancelado());
      const p = Math.min(1, (ahora - inicio) / ms);
      f(p);
      if (p < 1) raf = requestAnimationFrame(paso);
      else resolve();
    };
    raf = requestAnimationFrame(paso);
    señal?.addEventListener('abort', () => cancelAnimationFrame(raf), { once: true });
  });
}

/** Contenedor con scroll propio que contiene al elemento (o la página). */
function contenedorScroll(el: HTMLElement | null): HTMLElement {
  let n: HTMLElement | null = el;
  while (n && n !== document.body) {
    const s = getComputedStyle(n);
    if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 4) return n;
    n = n.parentElement;
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

/** Centro del elemento en coordenadas de viewport. */
export function centro(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Escribe en un input/textarea de React sin romper su estado controlado. */
function fijarValor(el: HTMLElement, valor: string) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const proto =
      el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    setter?.call(el, valor);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (el.isContentEditable) {
    el.textContent = valor;
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }
}

/** Formato de un número respetando el prefijo/sufijo del texto original. */
function formatear(original: string, n: number): string {
  const m = original.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
  if (!m) return String(Math.round(n));
  const pre = m[1] ?? '';
  const num = m[2] ?? '';
  const suf = m[3] ?? '';
  const decimales = (num.split('.')[1] ?? '').length;
  const conMiles = num.includes(',');
  const v = decimales > 0 ? n.toFixed(decimales) : String(Math.round(n));
  const [ent, dec] = v.split('.');
  const entF = conMiles ? (ent ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ent;
  return `${pre}${entF}${dec !== undefined ? '.' + dec : ''}${suf}`;
}

/** Elementos "hoja" con un número como texto (para los contadores). */
function numerosEn(raiz: HTMLElement): HTMLElement[] {
  const marcados = Array.from(raiz.querySelectorAll<HTMLElement>('[data-demo-contador]'));
  if (marcados.length) return marcados;
  const todos = Array.from(raiz.querySelectorAll<HTMLElement>('*')).filter(
    (el) =>
      el.children.length === 0 &&
      /^[^\d-]{0,3}-?\d[\d.,]{0,12}[^\d]{0,4}$/.test(el.textContent?.trim() ?? ''),
  );
  return todos.slice(0, 40);
}

export async function animarContadores(raiz: HTMLElement, ms = 1400, señal?: AbortSignal) {
  const els = numerosEn(raiz);
  const metas = els.map((el) => {
    const texto = el.textContent?.trim() ?? '';
    const n = parseFloat((texto.match(/-?[\d.,]+/)?.[0] ?? '0').replace(/,/g, ''));
    return { el, texto, n: isNaN(n) ? 0 : n };
  });
  await animar(
    ms,
    (p) => {
      const e = suave(p);
      for (const m of metas) m.el.textContent = p >= 1 ? m.texto : formatear(m.texto, m.n * e);
    },
    señal,
  );
}

/** Vuelve a dibujar las gráficas: quita y pone la clase que dispara las animaciones CSS. */
export async function redibujarGraficas(raiz: HTMLElement, señal?: AbortSignal) {
  raiz.classList.remove('demo-dibujar');
  // Forzar reflow para reiniciar las animaciones.
  void raiz.offsetWidth;
  raiz.classList.add('demo-dibujar');
  try {
    await dormir(1800, señal);
  } finally {
    raiz.classList.remove('demo-dibujar');
  }
}

export async function scrollLento(
  el: HTMLElement | null,
  ms: number,
  hasta: 'fin' | number = 'fin',
  volver = false,
  señal?: AbortSignal,
) {
  const c = contenedorScroll(el);
  const desde = c.scrollTop;
  const max = c.scrollHeight - c.clientHeight;
  const objetivo = Math.max(0, Math.min(max, hasta === 'fin' ? max : hasta));
  if (Math.abs(objetivo - desde) < 4) {
    await dormir(Math.min(ms, 800), señal);
    return;
  }
  await animar(ms, (p) => (c.scrollTop = desde + (objetivo - desde) * facil(p)), señal);
  if (volver) {
    await dormir(400, señal);
    await animar(700, (p) => (c.scrollTop = objetivo + (desde - objetivo) * suave(p)), señal);
  }
}

/**
 * Ejecuta una lista de acciones. Se cancela con la señal (al cerrar el
 * recorrido, cambiar de paso o desmontar).
 */
export async function ejecutar(acciones: Accion[], ctx: ContextoMotor, señal: AbortSignal) {
  for (const a of acciones) {
    if (señal.aborted) throw new Cancelado();
    switch (a.tipo) {
      case 'esperar':
        await dormir(a.ms, señal);
        break;

      case 'navegar': {
        if (ctx.pathname() !== a.ruta.split('?')[0]) {
          ctx.resaltar(null);
          ctx.navegar(a.ruta);
          // Esperar el cambio de ruta y que la vista tenga contenido.
          const inicio = performance.now();
          while (
            ctx.pathname() !== a.ruta.split('?')[0] &&
            performance.now() - inicio < (a.msMax ?? 8000)
          ) {
            await dormir(60, señal);
          }
        }
        await esperarSelector(a.esperar ?? 'main', a.msMax ?? 8000, señal);
        await dormir(250, señal);
        break;
      }

      case 'resaltar':
        ctx.resaltar(a.sel, a.desplazar ?? true);
        if (a.sel) await dormir(450, señal);
        break;

      case 'scrollLento': {
        const el = a.sel ? await esperarSelector(a.sel, 4000, señal) : null;
        await scrollLento(el, a.ms, a.hasta ?? 'fin', a.volver ?? false, señal);
        break;
      }

      case 'bloques':
        for (const s of a.sels) {
          const el = await esperarSelector(s, 3000, señal);
          if (!el) continue;
          ctx.resaltar(s, true);
          await dormir(a.msPorBloque, señal);
        }
        break;

      case 'clic': {
        const el = await esperarSelector(a.sel, a.msMax ?? 6000, señal);
        if (!el) break;
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        await dormir(350, señal);
        const c = centro(el);
        ctx.cursor(c.x, c.y);
        await dormir(520, señal);
        ctx.cursor(c.x, c.y, true);
        el.focus?.();
        el.click();
        await dormir(350, señal);
        break;
      }

      case 'escribir': {
        const el = await esperarSelector(a.sel, 6000, señal);
        if (!el) break;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await dormir(250, señal);
        const c = centro(el);
        ctx.cursor(c.x, c.y);
        await dormir(400, señal);
        ctx.cursor(c.x, c.y, true);
        el.focus();
        const por = a.msPorLetra ?? 38;
        for (let i = 1; i <= a.texto.length; i++) {
          fijarValor(el, a.texto.slice(0, i));
          await dormir(por + (a.texto[i - 1] === ' ' ? 40 : 0), señal);
        }
        break;
      }

      case 'contadores': {
        const raiz = a.sel ? await esperarSelector(a.sel, 3000, señal) : buscar('main');
        if (raiz) await animarContadores(raiz, a.ms ?? 1400, señal);
        break;
      }

      case 'graficas': {
        const raiz = a.sel ? await esperarSelector(a.sel, 3000, señal) : buscar('main');
        if (raiz) await redibujarGraficas(raiz, señal);
        break;
      }

      case 'menu':
        ctx.menu(a.abrir);
        await dormir(360, señal);
        break;

      case 'cursor': {
        if (a.sel) {
          const el = await esperarSelector(a.sel, 3000, señal);
          if (el) {
            const c = centro(el);
            ctx.cursor(c.x, c.y);
          }
        } else if (a.x !== undefined && a.y !== undefined) {
          ctx.cursor(a.x, a.y);
        }
        await dormir(a.ms ?? 500, señal);
        break;
      }

      case 'telefono':
        await ctx.telefono({ ruta: a.ruta, rotulo: a.rotulo, acciones: a.acciones });
        if (a.cerrarAlTerminar) {
          await dormir(600, señal);
          ctx.cerrarTelefono();
          await dormir(500, señal);
        }
        break;

      case 'cerrarTelefono':
        ctx.cerrarTelefono();
        await dormir(500, señal);
        break;

      case 'chip':
        ctx.chip(a.texto);
        break;

      case 'evento':
        window.dispatchEvent(new CustomEvent(a.nombre, { detail: a.detalle }));
        break;

      case 'refrescar':
        ctx.refrescar();
        await dormir(700, señal);
        break;
    }
  }
}

/** Duración estimada de un guion (para el cronómetro). */
export function duracionEstimada(acciones: Accion[]): number {
  let t = 0;
  for (const a of acciones) {
    switch (a.tipo) {
      case 'esperar':
        t += a.ms;
        break;
      case 'navegar':
        t += 900;
        break;
      case 'resaltar':
        t += 450;
        break;
      case 'scrollLento':
        t += a.ms + (a.volver ? 1100 : 0);
        break;
      case 'bloques':
        t += a.sels.length * a.msPorBloque;
        break;
      case 'clic':
        t += 1250;
        break;
      case 'escribir':
        t += 650 + a.texto.length * (a.msPorLetra ?? 38);
        break;
      case 'contadores':
        t += a.ms ?? 1400;
        break;
      case 'graficas':
        t += 1800;
        break;
      case 'menu':
        t += 360;
        break;
      case 'cursor':
        t += a.ms ?? 500;
        break;
      case 'telefono':
        t += 1200 + duracionEstimada(a.acciones) + (a.cerrarAlTerminar ? 1100 : 0);
        break;
      case 'cerrarTelefono':
        t += 500;
        break;
      case 'refrescar':
        t += 700;
        break;
      default:
        break;
    }
  }
  return t;
}
