'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, X, Lock, Share2, Bookmark, Check } from 'lucide-react';
import { crearDiarioAction } from '../../../app/paciente/actions';

const MANU = '[font-family:var(--font-manuscrita)]';

export function CrearDiario() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [privacidad, setPrivacidad] = useState('privado');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Bloquear scroll del fondo mientras el editor está abierto.
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [abierto]);

  const guardar = () => {
    if (!contenido.trim()) {
      setError('Escribe algo antes de guardar.');
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set('titulo', titulo);
    fd.set('contenido', contenido);
    fd.set('privacidad', privacidad);
    startTransition(async () => {
      const res = await crearDiarioAction(fd);
      if (res.ok) {
        setAbierto(false);
        setTitulo('');
        setContenido('');
        setPrivacidad('privado');
        router.refresh();
      } else {
        setError(res.error ?? 'Error');
      }
    });
  };

  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });

  return (
    <>
      {/* Botón largo estilo NOEMA */}
      <button
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-noema-deep px-5 py-4 text-base font-medium text-bone shadow-sm transition-colors hover:bg-noema-deep/90"
      >
        <PenLine className="size-5" strokeWidth={1.9} />
        Escribir en mi diario
      </button>

      {/* Editor a pantalla casi completa, tipo hoja de cuaderno */}
      {abierto && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#FBF7EE]">
          {/* Cabecera */}
          <header className="flex shrink-0 items-center justify-between border-b border-noema-deep/10 px-4 py-3">
            <button
              onClick={() => setAbierto(false)}
              className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
            >
              <X className="size-5" />
            </button>
            <span className={`${MANU} text-lg text-noema-deep/70`}>{hoy}</span>
            <button
              onClick={guardar}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full bg-noema-sage px-4 py-1.5 text-sm font-medium text-bone hover:bg-noema-sage/90 disabled:opacity-50"
            >
              <Check className="size-4" strokeWidth={2} />
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </header>

          {/* Hoja de escritura con renglones */}
          <div
            className="flex-1 overflow-y-auto px-5 py-5 sm:px-8"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent, transparent 37px, rgba(46,59,46,0.08) 38px)',
              backgroundAttachment: 'local',
            }}
          >
            <div className="mx-auto max-w-2xl">
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título (opcional)"
                className={`${MANU} mb-2 w-full bg-transparent text-3xl text-ink placeholder:text-ink/30 focus:outline-none`}
              />
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                autoFocus
                placeholder="Escribe lo que necesites… este es tu espacio."
                className={`${MANU} min-h-[55vh] w-full resize-none bg-transparent text-2xl leading-[38px] text-ink placeholder:text-ink/30 focus:outline-none`}
              />
            </div>
          </div>

          {/* Pie: privacidad + guardar */}
          <div className="shrink-0 border-t border-noema-deep/10 bg-[#FBF7EE] px-4 py-3">
            <div className="mx-auto max-w-2xl">
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-ink/50">Privacidad:</span>
                {[
                  { v: 'privado', l: 'Solo yo', icon: Lock },
                  { v: 'compartido', l: 'Compartir', icon: Share2 },
                  { v: 'marcado_sesion', l: 'Para sesión', icon: Bookmark },
                ].map((o) => {
                  const Icono = o.icon;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setPrivacidad(o.v)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        privacidad === o.v
                          ? 'border-noema-sage bg-noema-sage/15 text-noema-deep'
                          : 'border-ink/15 text-ink/60 hover:border-noema-sage'
                      }`}
                    >
                      <Icono className="size-3.5" strokeWidth={1.8} />
                      {o.l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
