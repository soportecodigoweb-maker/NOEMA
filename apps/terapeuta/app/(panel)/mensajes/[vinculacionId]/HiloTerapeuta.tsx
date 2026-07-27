'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Send, MessageSquareText, Zap, Plus, Trash2 } from 'lucide-react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { MENSAJES_PREESTABLECIDOS } from '@/lib/mensajes-preestablecidos';
import { enviarMensajeAction } from './actions';
import {
  crearMensajeRapidoAction,
  eliminarMensajeRapidoAction,
} from './rapidos-actions';

interface Mensaje {
  id: string;
  contenido: string;
  autor_id: string;
  creado_at: string;
  leido_at: string | null;
}

interface MensajeRapido {
  id: string;
  texto: string;
  vinculacion_id: string | null;
}

export interface HiloTerapeutaProps {
  vinculacionId: string;
  userId: string;
  mensajesIniciales: Mensaje[];
  rapidos: MensajeRapido[];
}

export function HiloTerapeuta({
  vinculacionId,
  userId,
  mensajesIniciales,
  rapidos,
}: HiloTerapeutaProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mostrarPresets, setMostrarPresets] = useState(false);
  const [mostrarRapidos, setMostrarRapidos] = useState(false);
  const [gestionar, setGestionar] = useState(false);
  const [nuevoRapido, setNuevoRapido] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mensajes.length]);

  // Tiempo real: mensajes del paciente llegan al instante.
  useEffect(() => {
    const canal = supabase
      .channel(`mensajes-terapeuta:${vinculacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `vinculacion_id=eq.${vinculacionId}`,
        },
        (payload) => {
          const nuevo = payload.new as Mensaje;
          setMensajes((prev) =>
            prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculacionId]);

  const enviar = (contenido: string) => {
    const t = contenido.trim();
    if (!t) return;
    setText('');
    setError(null);
    setMostrarRapidos(false);
    startTransition(async () => {
      const r = await enviarMensajeAction(vinculacionId, t);
      if (!r.ok) {
        setText(contenido);
        setError('No se pudo enviar. Intenta de nuevo.');
      }
      // El mensaje propio aparece por realtime (INSERT). Como respaldo lo
      // añadimos optimistamente si aún no llegó.
    });
  };

  const agregarRapido = () => {
    const t = nuevoRapido.trim();
    if (!t) return;
    setNuevoRapido('');
    startTransition(async () => {
      await crearMensajeRapidoAction(vinculacionId, t);
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Mensajes */}
      <div ref={scrollRef} className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        {mensajes.length === 0 ? (
          <div className="rounded-2xl border border-noema-deep/[0.06] bg-white py-12 text-center text-foreground-muted">
            Aún no hay mensajes. Escribe el primero.
          </div>
        ) : (
          <ul className="space-y-3">
            {mensajes.map((m) => {
              const mio = m.autor_id === userId;
              return (
                <li key={m.id} className={mio ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      mio
                        ? 'rounded-br-sm bg-noema-sage text-bone'
                        : 'rounded-bl-sm border border-noema-deep/[0.06] bg-bone text-ink'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.contenido}</p>
                    <p className={`mt-1 text-[10px] ${mio ? 'text-bone/60' : 'text-foreground-muted'}`}>
                      {new Date(m.creado_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Mexico_City',
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-noema-deep/[0.06] bg-paper p-4">
        <div className="mx-auto max-w-3xl space-y-2">
          {/* Panel: mensajes rápidos por paciente (#6/#7) */}
          {mostrarRapidos && (
            <div className="rounded-lg border border-noema-deep/10 bg-white p-2">
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-[11px] uppercase tracking-wider text-noema-sage">
                  Mensajes rápidos · se envían al instante
                </span>
                <button
                  type="button"
                  onClick={() => setGestionar((v) => !v)}
                  className="text-xs text-noema-sage hover:underline"
                >
                  {gestionar ? 'Listo' : 'Gestionar'}
                </button>
              </div>

              {rapidos.length === 0 && !gestionar && (
                <p className="px-2 py-1 text-xs text-foreground-muted">
                  Aún no tienes mensajes rápidos. Pulsa “Gestionar” para crear los que
                  quieras enviar de un toque a este paciente.
                </p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {rapidos.map((r) => (
                  <div key={r.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => enviar(r.texto)}
                      disabled={isPending}
                      className="rounded-full border border-noema-sage/40 bg-noema-sage/10 px-3 py-1.5 text-left text-xs text-ink hover:bg-noema-sage/20 disabled:opacity-50"
                    >
                      {r.texto}
                    </button>
                    {gestionar && (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await eliminarMensajeRapidoAction(r.id, vinculacionId);
                          })
                        }
                        aria-label="Eliminar"
                        className="ml-1 text-foreground-muted hover:text-noema-clay"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {gestionar && (
                <div className="mt-2 flex items-center gap-2 border-t border-noema-deep/8 pt-2">
                  <input
                    value={nuevoRapido}
                    onChange={(e) => setNuevoRapido(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarRapido();
                      }
                    }}
                    placeholder="Nuevo mensaje rápido para este paciente…"
                    className="flex-1 rounded-md border border-noema-deep/15 bg-bone px-3 py-1.5 text-sm focus:border-noema-sage focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={agregarRapido}
                    className="inline-flex items-center gap-1 rounded-md bg-noema-deep px-3 py-1.5 text-xs font-medium text-bone hover:bg-noema-deep/90"
                  >
                    <Plus className="size-3.5" strokeWidth={2} />
                    Añadir
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Panel: corpus de mensajes preestablecidos (edición antes de enviar) */}
          {mostrarPresets && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-noema-deep/10 bg-white p-2">
              {MENSAJES_PREESTABLECIDOS.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setText(m.texto);
                    setMostrarPresets(false);
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-paper/60"
                >
                  <span className="text-[11px] uppercase tracking-wider text-noema-sage">
                    {m.categoria}
                  </span>
                  <span className="block text-ink/80">{m.texto}</span>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(text);
            }}
            className="flex items-end gap-2"
          >
            <button
              type="button"
              onClick={() => {
                setMostrarRapidos((v) => !v);
                setMostrarPresets(false);
              }}
              aria-label="Mensajes rápidos"
              title="Mensajes rápidos (envío inmediato)"
              className={`flex size-11 shrink-0 items-center justify-center rounded-md border bg-bone hover:border-noema-sage ${
                mostrarRapidos ? 'border-noema-sage text-noema-sage' : 'border-noema-deep/10 text-noema-deep/70'
              }`}
            >
              <Zap className="size-4" strokeWidth={1.7} />
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarPresets((v) => !v);
                setMostrarRapidos(false);
              }}
              aria-label="Mensajes preestablecidos"
              title="Corpus de mensajes (editar antes de enviar)"
              className="flex size-11 shrink-0 items-center justify-center rounded-md border border-noema-deep/10 bg-bone text-noema-deep/70 hover:border-noema-sage hover:text-noema-deep"
            >
              <MessageSquareText className="size-4" strokeWidth={1.7} />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar(text);
                }
              }}
              placeholder="Escribe tu mensaje… (Enter para enviar)"
              aria-label="Mensaje para el paciente"
              rows={1}
              className="max-h-[200px] min-h-[44px] flex-1 resize-none rounded-md border border-noema-deep/10 bg-bone px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/35 focus:border-noema-sage focus:outline-none focus:ring-1 focus:ring-noema-sage"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isPending}
              disabled={!text.trim()}
              aria-label="Enviar mensaje"
            >
              <Send className="size-4" strokeWidth={1.8} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
