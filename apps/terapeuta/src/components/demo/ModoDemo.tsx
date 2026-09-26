'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MSG, type RolDemo } from '@/lib/demo/constantes';
import { Cancelado, dormir, ejecutar, type ContextoMotor } from '@/lib/demo/motor';
import type { Accion, PasoRecorrido } from '@/lib/demo/tipos';
import { RECORRIDO_PSICOLOGO } from '@/lib/demo/recorrido-psicologo';
import { RECORRIDO_PACIENTE } from '@/lib/demo/recorrido-paciente';
import { CursorDemo } from './CursorDemo';
import { Resaltado, type Marco } from './Resaltado';
import { TiraDemo } from './TiraDemo';
import { TarjetaRecorrido } from './TarjetaRecorrido';
import { VentanaTelefono } from './VentanaTelefono';
import './demo.css';

interface Props {
  rol: RolDemo;
  vinculacionId: string | null;
}

/** Sustituye {vinc} en las rutas de un guion. */
function resolver(acciones: Accion[], vinc: string | null): Accion[] {
  const v = vinc ?? '';
  return acciones.map((a) => {
    if (a.tipo === 'navegar') return { ...a, ruta: a.ruta.replace('{vinc}', v) };
    if (a.tipo === 'telefono')
      return { ...a, ruta: a.ruta.replace('{vinc}', v), acciones: resolver(a.acciones, vinc) };
    return a;
  });
}

interface Persistido {
  estado: 'corriendo' | 'terminado';
  idx: number;
}

/**
 * Capa del modo demo montada en los layouts del panel y del paciente cuando la
 * cuenta con sesión es una cuenta demo.
 *
 * Dos modos:
 *  - Normal (ventana principal): tira superior, recorrido guiado con tarjeta,
 *    resaltado, cursor y ventana de teléfono.
 *  - Embebido (dentro de un iframe del reproductor de video o de la ventana
 *    de teléfono): sin tira ni tarjeta; ejecuta los guiones que le manda el
 *    padre por postMessage y le avisa cuando termina.
 */
export function ModoDemo({ rol, vinculacionId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const [embebido, setEmbebido] = useState<boolean | null>(null);
  const [resaltado, setResaltado] = useState<{ sel: string | null; desplazar: boolean }>({
    sel: null,
    desplazar: true,
  });
  const [marco, setMarco] = useState<Marco | null>(null);
  const [cursor, setCursor] = useState({ x: -100, y: -100, visible: false, clic: 0 });
  const cursorTimer = useRef<number>(0);
  const [telefono, setTelefono] = useState<{
    ruta: string;
    rotulo: string;
    acciones: Accion[];
    resolve: () => void;
  } | null>(null);

  const pasos: PasoRecorrido[] = useMemo(
    () => (rol === 'psicologo' ? RECORRIDO_PSICOLOGO : RECORRIDO_PACIENTE).pasos,
    [rol],
  );
  const totalMs = useMemo(() => pasos.reduce((a, p) => a + p.ms, 0), [pasos]);

  const [estado, setEstado] = useState<'inactivo' | 'corriendo' | 'terminado'>('inactivo');
  const [idx, setIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  // Cambia cada vez que se (re)inicia o se salta de paso: fuerza a correr el paso aunque idx no cambie.
  const [ronda, setRonda] = useState(0);
  const pausadoRef = useRef(false);
  pausadoRef.current = pausado;
  const abort = useRef<AbortController | null>(null);
  const elapsed = useRef(0);
  const [tick, setTick] = useState(0);

  const claveSesion = `noema:demo:recorrido:${rol}`;

  // ── Contexto que el motor usa para tocar la interfaz ──────────────────────
  const ctx = useMemo<ContextoMotor>(
    () => ({
      navegar: (ruta) => router.push(ruta),
      refrescar: () => router.refresh(),
      pathname: () => pathRef.current,
      resaltar: (sel, desplazar = true) => setResaltado({ sel, desplazar }),
      cursor: (x, y, clic) => {
        setCursor((c) => ({ x, y, visible: true, clic: clic ? c.clic + 1 : c.clic }));
        window.clearTimeout(cursorTimer.current);
        cursorTimer.current = window.setTimeout(
          () => setCursor((c) => ({ ...c, visible: false })),
          2600,
        );
      },
      chip: (texto) => {
        if (window.self !== window.top)
          window.parent.postMessage({ tipo: MSG.chip, texto }, window.location.origin);
      },
      telefono: (cfg) =>
        new Promise<void>((resolve) => {
          if (window.self !== window.top) return resolve(); // sin teléfono dentro de un teléfono
          setTelefono({ ...cfg, resolve });
        }),
      cerrarTelefono: () => setTelefono((t) => (t?.resolve(), null)),
      menu: (abrir) => window.dispatchEvent(new CustomEvent('noema:menu', { detail: { abrir } })),
    }),
    [router],
  );

  // ── Modo embebido: obedecer al padre ──────────────────────────────────────
  useEffect(() => {
    const emb = window.self !== window.top;
    setEmbebido(emb);
    if (!emb) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { tipo?: string; id?: string; acciones?: Accion[] } | null;
      if (!d || typeof d !== 'object') return;
      if (d.tipo === MSG.guion && d.acciones) {
        abort.current?.abort();
        const ac = new AbortController();
        abort.current = ac;
        ejecutar(resolver(d.acciones, vinculacionId), ctx, ac.signal)
          .catch(() => {})
          .finally(() => {
            if (!ac.signal.aborted)
              window.parent.postMessage({ tipo: MSG.listo, id: d.id }, window.location.origin);
          });
      } else if (d.tipo === MSG.cancelar) {
        abort.current?.abort();
        setResaltado({ sel: null, desplazar: true });
      }
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ tipo: MSG.hola }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, [ctx, vinculacionId]);

  // ── Tira: empuja la app hacia abajo ───────────────────────────────────────
  useEffect(() => {
    if (embebido !== false) return;
    document.documentElement.classList.add('demo-con-tira');
    return () => document.documentElement.classList.remove('demo-con-tira');
  }, [embebido]);

  // ── Restaurar el recorrido tras una recarga o arrancarlo desde la URL ─────
  useEffect(() => {
    if (embebido !== false) return;
    let arranque: Persistido | null = null;
    try {
      const raw = sessionStorage.getItem(claveSesion);
      if (raw) arranque = JSON.parse(raw) as Persistido;
    } catch {
      /* noop */
    }
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('recorrido') === '1') {
      arranque = { estado: 'corriendo', idx: 0 };
      sp.delete('recorrido');
      const q = sp.toString();
      window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''));
    }
    if (arranque && arranque.idx < pasos.length) {
      setIdx(arranque.idx);
      setEstado(arranque.estado);
      elapsed.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embebido]);

  useEffect(() => {
    if (embebido !== false) return;
    try {
      if (estado === 'inactivo') sessionStorage.removeItem(claveSesion);
      else
        sessionStorage.setItem(claveSesion, JSON.stringify({ estado, idx } satisfies Persistido));
    } catch {
      /* noop */
    }
  }, [estado, idx, claveSesion, embebido]);

  // ── Correr el paso actual ─────────────────────────────────────────────────
  useEffect(() => {
    if (embebido !== false || estado !== 'corriendo') return;
    const paso = pasos[idx];
    if (!paso) return;
    const ac = new AbortController();
    abort.current = ac;
    elapsed.current = 0;
    const inicio = performance.now();
    (async () => {
      try {
        await ejecutar(resolver(paso.acciones, vinculacionId), ctx, ac.signal);
        const restante = paso.ms - (performance.now() - inicio);
        if (restante > 0) await dormir(restante, ac.signal);
        while (pausadoRef.current) await dormir(200, ac.signal);
      } catch (e) {
        if (e instanceof Cancelado) return;
      }
      if (ac.signal.aborted) return;
      if (paso.cierre || idx >= pasos.length - 1) {
        setEstado('terminado');
      } else {
        setIdx(idx + 1);
      }
    })();
    return () => ac.abort();
  }, [embebido, estado, idx, ronda, pasos, ctx, vinculacionId]);

  // Cronómetro (solo avanza si no está en pausa).
  useEffect(() => {
    if (estado !== 'corriendo') return;
    const iv = window.setInterval(() => {
      if (!pausadoRef.current) elapsed.current += 250;
      setTick((t) => t + 1);
    }, 250);
    return () => clearInterval(iv);
  }, [estado, idx]);

  // Al terminar o cerrar: dejar la app libre.
  useEffect(() => {
    if (estado === 'corriendo') return;
    setResaltado({ sel: null, desplazar: true });
    setTelefono((t) => (t?.resolve(), null));
  }, [estado]);

  const iniciar = useCallback(() => {
    abort.current?.abort();
    setPausado(false);
    setIdx(0);
    setRonda((r) => r + 1);
    setEstado('corriendo');
  }, []);
  const ir = useCallback(
    (delta: number) => {
      abort.current?.abort();
      setTelefono((t) => (t?.resolve(), null));
      setPausado(false);
      // Con función para que varios clics seguidos no se pisen entre renders.
      setIdx((i) => Math.max(0, Math.min(pasos.length - 1, i + delta)));
      setRonda((r) => r + 1);
      setEstado('corriendo');
    },
    [pasos.length],
  );
  const cerrar = useCallback(() => {
    abort.current?.abort();
    setEstado('inactivo');
    setPausado(false);
  }, []);
  const pausa = useCallback(() => {
    if (estado === 'terminado') return iniciar();
    setPausado((p) => !p);
  }, [estado, iniciar]);

  if (embebido === null) return null;

  const paso = pasos[idx];
  const transcurrido =
    pasos.slice(0, idx).reduce((a, p) => a + p.ms, 0) +
    (estado === 'terminado' ? (paso?.ms ?? 0) : Math.min(paso?.ms ?? 0, elapsed.current));
  void tick;

  return (
    <>
      <Resaltado sel={resaltado.sel} desplazar={resaltado.desplazar} onMarco={setMarco} />
      <CursorDemo x={cursor.x} y={cursor.y} visible={cursor.visible} clic={cursor.clic} />
      {!embebido && (
        <>
          <TiraDemo rol={rol} recorriendo={estado === 'corriendo'} onRecorrido={iniciar} />
          {telefono && (
            <VentanaTelefono
              ruta={telefono.ruta}
              rotulo={telefono.rotulo}
              acciones={telefono.acciones}
              onListo={() => telefono.resolve()}
            />
          )}
          {estado !== 'inactivo' && paso && (
            <TarjetaRecorrido
              paso={paso}
              idx={idx}
              total={pasos.length}
              pausado={pausado}
              terminado={estado === 'terminado'}
              transcurridoMs={transcurrido}
              totalMs={totalMs}
              marco={resaltado.sel ? marco : null}
              onAnterior={() => ir(-1)}
              onSiguiente={() => ir(1)}
              onPausa={pausa}
              onCerrar={cerrar}
            />
          )}
        </>
      )}
    </>
  );
}
