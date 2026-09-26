'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MousePointerClick } from 'lucide-react';
import type { Diapositiva as D } from '@/lib/demo/tipos';
import type { RolDemo } from '@/lib/demo/constantes';
import { AppEmbebida, type AppEmbebidaHandle } from '../AppEmbebida';
import { AppEscalada, LAPTOP, MarcoLaptop, MarcoTelefono, TELEFONO } from '../Marcos';
import { TituloPalabras } from './TituloPalabras';
import { Contador } from './Contador';
import { Vesica } from '@/components/ui/Vesica';

interface Props {
  d: D;
  rol: RolDemo;
  activa: boolean;
  /** Oculta (precargando la siguiente) */
  oculta: boolean;
  saliendo: boolean;
  vinc: string | null;
  total: number;
  numero: number;
}

const COLORES_CHIP = ['#D9B98C', '#C7D2BD', '#B9C9CC', '#E8B5AB', '#F0C9AE'];

function ruta(r: string, vinc: string | null) {
  return r.replace('{vinc}', vinc ?? '');
}

/**
 * Una diapositiva: texto a la izquierda (etiqueta, título palabra por palabra,
 * párrafo) y a la derecha la app real dentro de un marco, operándose sola.
 * Los guiones corren mientras la diapositiva está activa, incluso en pausa.
 */
export function Diapositiva({ d, rol, activa, oculta, saliendo, vinc, total, numero }: Props) {
  const laptop = useRef<AppEmbebidaHandle>(null);
  const tel = useRef<AppEmbebidaHandle>(null);
  const tel2 = useRef<AppEmbebidaHandle>(null);
  const [chips, setChips] = useState<string[]>([]);
  const agregarChip = useCallback(
    (t: string) => setChips((c) => (c.includes(t) ? c : [...c, t])),
    [],
  );

  // Guiones: arrancan al activarse; se repiten si la diapositiva lo pide.
  useEffect(() => {
    if (!activa) return;
    let vivo = true;
    setChips([]);
    const correr = async (
      ref: React.RefObject<AppEmbebidaHandle | null>,
      cfg?: {
        guion?: D['laptop'] extends infer L ? (L extends { guion?: infer G } ? G : never) : never;
        repetir?: boolean;
      },
    ) => {
      if (!cfg?.guion) return;
      await new Promise((r) => setTimeout(r, 900));
      do {
        if (!vivo) return;
        await ref.current?.ejecutar(cfg.guion);
        if (cfg.repetir && vivo) await new Promise((r) => setTimeout(r, 1200));
      } while (cfg.repetir && vivo);
    };
    void correr(laptop, d.laptop);
    void correr(tel, d.telefono);
    void correr(tel2, d.telefono2);
    // Chips fijos: aparecen escalonados a lo largo de la diapositiva.
    const ts = (d.chips ?? []).map((c, i) =>
      window.setTimeout(
        () => vivo && agregarChip(c),
        1800 + i * Math.max(1500, (d.ms - 3000) / Math.max(1, (d.chips?.length ?? 1) + 1)),
      ),
    );
    return () => {
      vivo = false;
      ts.forEach(clearTimeout);
      laptop.current?.cancelar();
      tel.current?.cancelar();
      tel2.current?.cancelar();
    };
  }, [activa, d, agregarChip]);

  const capa = (n: number) => ({
    className: 'demo-anim-capa',
    style: { animationDelay: `${120 + n * 140}ms` },
  });

  if (d.especial === 'portada') {
    return (
      <section
        className={`demo-video-escena ${saliendo ? 'saliendo' : ''}`}
        style={{ gridTemplateColumns: '1fr', display: oculta ? 'none' : undefined }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span {...capa(0)} className="demo-anim-capa flex items-center gap-3">
            <Vesica size={34} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.4} />
            <span className="font-serif text-2xl tracking-[0.34em]">NOEMA</span>
          </span>
          <p
            className="demo-video-etiqueta demo-anim-fundido mt-8"
            style={{ animationDelay: '300ms' }}
          >
            {d.etiqueta}
          </p>
          <h1 className="demo-video-titulo">
            <TituloPalabras texto={d.titulo} retrasoMs={500} />
          </h1>
          <p
            className="demo-video-parrafo demo-anim-subir mx-auto max-w-xl"
            style={{ animationDelay: '1300ms' }}
          >
            {d.parrafo}
          </p>
        </div>
      </section>
    );
  }

  if (d.especial === 'precio' || d.especial === 'cierre') {
    const otro: RolDemo = rol === 'psicologo' ? 'paciente' : 'psicologo';
    const entrar = `/demo/entrar?rol=${rol}&a=${encodeURIComponent(rol === 'psicologo' ? '/inicio?recorrido=1' : '/paciente?recorrido=1')}`;
    return (
      <section
        className={`demo-video-escena ${saliendo ? 'saliendo' : ''}`}
        style={{ gridTemplateColumns: '1fr', display: oculta ? 'none' : undefined }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="demo-video-etiqueta demo-anim-fundido" style={{ animationDelay: '200ms' }}>
            {String(numero).padStart(2, '0')} / {String(total).padStart(2, '0')} · {d.etiqueta}
          </p>
          {d.especial === 'precio' && d.precio ? (
            <>
              <p className="demo-precio demo-anim-capa" style={{ animationDelay: '300ms' }}>
                <Contador hasta={d.precio.monto} prefijo="$" ms={1800} retrasoMs={600} />
                <span className="ml-3 font-sans text-[0.22em] tracking-wider text-[#E2B6A5]">
                  {d.precio.unidad}
                </span>
              </p>
              <h1 className="demo-video-titulo mt-2">
                <TituloPalabras texto={d.titulo} retrasoMs={1500} />
              </h1>
              <p
                className="demo-video-parrafo demo-anim-subir mx-auto max-w-xl"
                style={{ animationDelay: '2400ms' }}
              >
                {d.precio.nota}
              </p>
            </>
          ) : (
            <>
              <h1 className="demo-video-titulo">
                <TituloPalabras texto={d.titulo} retrasoMs={400} />
              </h1>
              <p
                className="demo-video-parrafo demo-anim-subir mx-auto max-w-xl"
                style={{ animationDelay: '1300ms' }}
              >
                {d.parrafo}
              </p>
            </>
          )}
          <div
            className="demo-anim-subir mt-10 flex flex-wrap justify-center gap-3"
            style={{ animationDelay: '3000ms' }}
          >
            <Link
              href={entrar}
              className="inline-flex items-center gap-2 rounded-md bg-bone px-5 py-3 font-medium text-[#1D271E] hover:bg-bone/90"
            >
              <MousePointerClick className="size-4" /> Ahora pruébalo tú
            </Link>
            <Link
              href={`/demo/video/${otro}`}
              className="inline-flex items-center gap-2 rounded-md border border-bone/25 px-5 py-3 text-bone/90 hover:bg-bone/10"
            >
              Ver el video {otro === 'paciente' ? 'del paciente' : 'del psicólogo'}{' '}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`demo-video-escena ${saliendo ? 'saliendo' : ''}`}
      style={{ display: oculta ? 'none' : undefined }}
    >
      <div className="demo-video-texto">
        <p className="demo-video-etiqueta demo-anim-fundido" style={{ animationDelay: '250ms' }}>
          {String(numero).padStart(2, '0')} / {String(total).padStart(2, '0')} · {d.etiqueta}
        </p>
        <h1 className="demo-video-titulo">
          <TituloPalabras texto={d.titulo} retrasoMs={450} />
        </h1>
        <p className="demo-video-parrafo demo-anim-subir" style={{ animationDelay: '1200ms' }}>
          {d.parrafo}
        </p>
      </div>

      <div className="demo-video-escenario">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full items-end justify-center gap-[3vw]">
            {(d.marco === 'laptop' || d.marco === 'laptop-telefono') && d.laptop && (
              <div
                {...capa(0)}
                className="demo-anim-capa w-full"
                style={{
                  animationDelay: '100ms',
                  maxWidth: d.marco === 'laptop-telefono' ? '72%' : undefined,
                }}
              >
                <MarcoLaptop>
                  <AppEscalada ancho={LAPTOP.ancho} alto={LAPTOP.alto}>
                    {() => (
                      <AppEmbebida
                        ref={laptop}
                        src={ruta(d.laptop!.ruta, vinc)}
                        ancho={LAPTOP.ancho}
                        alto={LAPTOP.alto}
                        titulo="Panel de la psicóloga"
                        onChip={agregarChip}
                      />
                    )}
                  </AppEscalada>
                </MarcoLaptop>
              </div>
            )}
            {(d.marco === 'telefono' ||
              d.marco === 'laptop-telefono' ||
              d.marco === 'dos-telefonos') &&
              d.telefono && (
                <div
                  {...capa(3)}
                  className="demo-anim-capa shrink-0"
                  style={{ animationDelay: '520ms' }}
                >
                  <MarcoTelefono ancho={d.marco === 'telefono' ? 300 : 230}>
                    <AppEscalada ancho={TELEFONO.ancho} alto={TELEFONO.alto}>
                      {() => (
                        <AppEmbebida
                          ref={tel}
                          src={ruta(d.telefono!.ruta, vinc)}
                          ancho={TELEFONO.ancho}
                          alto={TELEFONO.alto}
                          titulo="App del paciente"
                          onChip={agregarChip}
                        />
                      )}
                    </AppEscalada>
                  </MarcoTelefono>
                </div>
              )}
            {d.marco === 'dos-telefonos' && d.telefono2 && (
              <div
                {...capa(4)}
                className="demo-anim-capa shrink-0"
                style={{ animationDelay: '700ms' }}
              >
                <MarcoTelefono ancho={230}>
                  <AppEscalada ancho={TELEFONO.ancho} alto={TELEFONO.alto}>
                    {() => (
                      <AppEmbebida
                        ref={tel2}
                        src={ruta(d.telefono2!.ruta, vinc)}
                        ancho={TELEFONO.ancho}
                        alto={TELEFONO.alto}
                        titulo="Panel de la psicóloga"
                        onChip={agregarChip}
                      />
                    )}
                  </AppEscalada>
                </MarcoTelefono>
              </div>
            )}
          </div>
          <div className="demo-chips">
            {chips.map((c, i) => (
              <span
                key={c}
                className="demo-chip"
                style={{ ['--chip' as string]: COLORES_CHIP[i % COLORES_CHIP.length] }}
              >
                <i /> {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
