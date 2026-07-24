'use client';

import { useEffect, useRef, useState } from 'react';
import { Music2, X, Play, Pause, CloudRain, Waves, Wind, Sparkles } from 'lucide-react';

type Preset = 'lluvia' | 'olas' | 'viento' | 'suave';

interface DefPreset {
  key: Preset;
  nombre: string;
  icon: typeof CloudRain;
  ruido: 'blanco' | 'marron';
  filtro: BiquadFilterType;
  freq: number;
  lfoHz: number | null; // modulación de amplitud (olas/viento)
  ganancia: number;
}

const PRESETS: DefPreset[] = [
  { key: 'lluvia', nombre: 'Lluvia', icon: CloudRain, ruido: 'blanco', filtro: 'highpass', freq: 1000, lfoHz: null, ganancia: 0.5 },
  { key: 'olas', nombre: 'Olas', icon: Waves, ruido: 'marron', filtro: 'lowpass', freq: 500, lfoHz: 0.08, ganancia: 1 },
  { key: 'viento', nombre: 'Viento', icon: Wind, ruido: 'marron', filtro: 'lowpass', freq: 320, lfoHz: 0.15, ganancia: 0.9 },
  { key: 'suave', nombre: 'Ruido suave', icon: Sparkles, ruido: 'marron', filtro: 'lowpass', freq: 420, lfoHz: null, ganancia: 0.7 },
];

function crearBufferRuido(ctx: AudioContext, tipo: 'blanco' | 'marron'): AudioBuffer {
  const n = ctx.sampleRate * 2; // 2 s en bucle
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (tipo === 'marron') {
    let last = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Sonidos relajantes ambientales, sintetizados con Web Audio (sin archivos).
 * El paciente los activa/desactiva, elige el sonido y ajusta el volumen.
 */
export function SonidosRelajantes() {
  const [abierto, setAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [preset, setPreset] = useState<Preset>('lluvia');
  const [volumen, setVolumen] = useState(0.5);

  const ctxRef = useRef<AudioContext | null>(null);
  const nodosRef = useRef<{ src?: AudioBufferSourceNode; lfo?: OscillatorNode; master?: GainNode }>({});

  const detener = () => {
    const { src, lfo } = nodosRef.current;
    try {
      src?.stop();
      lfo?.stop();
    } catch {
      /* ya detenido */
    }
    nodosRef.current = {};
    setSonando(false);
  };

  const reproducir = (p: Preset) => {
    const def = PRESETS.find((x) => x.key === p)!;
    let ctx = ctxRef.current;
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      ctxRef.current = ctx;
    }
    if (ctx.state === 'suspended') void ctx.resume();

    detener();

    const src = ctx.createBufferSource();
    src.buffer = crearBufferRuido(ctx, def.ruido);
    src.loop = true;

    const filtro = ctx.createBiquadFilter();
    filtro.type = def.filtro;
    filtro.frequency.value = def.freq;

    const master = ctx.createGain();
    master.gain.value = volumen * def.ganancia;

    src.connect(filtro).connect(master).connect(ctx.destination);
    src.start();

    let lfo: OscillatorNode | undefined;
    if (def.lfoHz) {
      // Modula la amplitud para dar sensación de vaivén (olas/viento).
      lfo = ctx.createOscillator();
      lfo.frequency.value = def.lfoHz;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = volumen * def.ganancia * 0.4;
      master.gain.value = volumen * def.ganancia * 0.6;
      lfo.connect(lfoGain).connect(master.gain);
      lfo.start();
    }

    nodosRef.current = { src, lfo, master };
    setSonando(true);
  };

  // Ajuste de volumen en vivo.
  useEffect(() => {
    const def = PRESETS.find((x) => x.key === preset)!;
    const master = nodosRef.current.master;
    if (master) master.gain.value = volumen * def.ganancia * (def.lfoHz ? 0.6 : 1);
  }, [volumen, preset]);

  // Limpieza al desmontar.
  useEffect(() => () => detener(), []);

  const toggle = () => {
    if (sonando) detener();
    else reproducir(preset);
  };

  const elegir = (p: Preset) => {
    setPreset(p);
    reproducir(p); // cambia y suena de inmediato
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {abierto ? (
        <div className="w-64 rounded-2xl border border-noema-deep/10 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
              <Music2 className="size-4 text-noema-sage" strokeWidth={1.8} /> Sonidos relajantes
            </p>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
              <X className="size-4" />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const Icono = p.icon;
              const activo = preset === p.key && sonando;
              return (
                <button
                  key={p.key}
                  onClick={() => elegir(p.key)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                    activo
                      ? 'border-noema-sage bg-noema-sage/10 text-noema-deep'
                      : 'border-noema-deep/15 text-ink/70 hover:border-noema-sage'
                  }`}
                >
                  <Icono className="size-4 shrink-0 text-noema-sage" strokeWidth={1.7} />
                  {p.nombre}
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-deep text-bone hover:bg-noema-deep/90"
              aria-label={sonando ? 'Pausar' : 'Reproducir'}
            >
              {sonando ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volumen}
              onChange={(e) => setVolumen(Number(e.target.value))}
              className="flex-1 accent-noema-sage"
              aria-label="Volumen"
            />
          </div>
          <p className="text-[11px] text-foreground-muted">
            Sonidos ambientales para acompañar tu momento. Se detienen al pausar o cerrar la app.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setAbierto(true)}
          aria-label="Sonidos relajantes"
          className={`flex size-11 items-center justify-center rounded-full border border-noema-deep/10 bg-white text-noema-sage shadow-lg transition-colors hover:bg-bone ${
            sonando ? 'ring-2 ring-noema-sage/40' : ''
          }`}
        >
          <Music2 className="size-5" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
