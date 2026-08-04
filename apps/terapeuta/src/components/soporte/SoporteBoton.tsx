'use client';

import { useState, useTransition } from 'react';
import { LifeBuoy, X, Check } from 'lucide-react';
import { enviarSolicitudSoporteAction, type TipoSolicitud } from '../../../app/soporte-actions';

const TIPOS: { key: TipoSolicitud; label: string }[] = [
  { key: 'soporte', label: 'Soporte técnico' },
  { key: 'duda', label: 'Duda' },
  { key: 'sugerencia', label: 'Sugerencia' },
  { key: 'observacion', label: 'Observación' },
];

/**
 * Botón flotante de "Ayuda / dudas y sugerencias". Al enviar, la solicitud
 * llega al Panel de Dueño de NOEMA. Se usa en la app de paciente y de terapeuta.
 */
export function SoporteBoton({ tono = 'claro' }: { tono?: 'claro' | 'oscuro' }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoSolicitud>('duda');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const enviar = () => {
    setError(null);
    startTransition(async () => {
      const r = await enviarSolicitudSoporteAction(tipo, asunto, mensaje);
      if (r.ok) {
        setEnviado(true);
        setMensaje('');
        setAsunto('');
      } else {
        setError(r.error ?? 'No se pudo enviar.');
      }
    });
  };

  const cerrar = () => {
    setAbierto(false);
    setEnviado(false);
    setError(null);
  };

  const input =
    'w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-colors ${
          tono === 'oscuro'
            ? 'bg-bone text-noema-deep hover:bg-bone/90'
            : 'bg-noema-deep text-bone hover:bg-noema-deep/90'
        }`}
      >
        <LifeBuoy className="size-4" strokeWidth={1.8} /> Ayuda
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-noema-deep/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">Ayuda, dudas y sugerencias</h2>
              <button onClick={cerrar} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                <X className="size-5" />
              </button>
            </div>

            {enviado ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-noema-sage/15">
                  <Check className="size-6 text-noema-sage" />
                </div>
                <p className="mt-3 text-sm text-ink/80">
                  ¡Gracias! Tu mensaje llegó al equipo de NOEMA. Te responderemos si hace falta.
                </p>
                <button
                  onClick={cerrar}
                  className="mt-4 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
                >
                  Listo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {TIPOS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTipo(t.key)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        tipo === t.key
                          ? 'bg-noema-sage text-bone'
                          : 'bg-noema-deep/[0.06] text-ink/70 hover:bg-noema-deep/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <input className={input} value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto (opcional)" />
                <textarea
                  className={`${input} min-h-[120px]`}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos tu duda, sugerencia o el problema que tienes…"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  onClick={enviar}
                  disabled={pending || !mensaje.trim()}
                  className="w-full rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                >
                  {pending ? 'Enviando…' : 'Enviar a NOEMA'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
