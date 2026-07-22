'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface Mensaje {
  id: string;
  autor_id: string;
  contenido: string;
  creado_at: string;
  leido_at: string | null;
}

export interface MensajesThreadProps {
  vinculacionId: string;
  userId: string;
  terapeutaNombre: string;
  mensajesIniciales: Mensaje[];
}

export function MensajesThread({
  vinculacionId,
  userId,
  terapeutaNombre,
  mensajesIniciales,
}: MensajesThreadProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);
  const [texto, setTexto] = useState('');
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mensajes.length]);

  // Tiempo real: escucha mensajes nuevos de esta conversación (los del
  // terapeuta llegan al instante, sin recargar).
  useEffect(() => {
    const canal = supabase
      .channel(`mensajes:${vinculacionId}`)
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

  const enviar = () => {
    const contenido = texto.trim();
    if (!contenido) return;
    setTexto('');

    startTransition(async () => {
      const { data, error } = await supabase
        .from('mensajes')
        .insert({
          vinculacion_id: vinculacionId,
          autor_id: userId,
          contenido,
        })
        .select('id, autor_id, contenido, creado_at, leido_at')
        .single();

      if (error || !data) {
        setTexto(contenido); // devolvemos el texto para reintentar
        return;
      }
      setMensajes((prev) => [...prev, data]);
    });
  };

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-8 py-10">
      <header className="mb-6 shrink-0">
        <p className="text-sm text-noema-sage/70">Mensajes con</p>
        <h1 className="mt-1 font-serif text-2xl text-ink">{terapeutaNombre}</h1>
        <p className="mt-1 text-xs text-ink/50">
          Comunicación asíncrona · Tu terapeuta responde en horas de consulta.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border-[0.5px] border-ink/10 bg-white p-6"
      >
        {mensajes.length === 0 ? (
          <p className="pt-8 text-center text-sm text-ink/50">
            Aún no hay mensajes. Escribe uno para comenzar.
          </p>
        ) : (
          mensajes.map((m) => {
            const esMio = m.autor_id === userId;
            return (
              <div
                key={m.id}
                className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    esMio
                      ? 'bg-noema-deep text-bone'
                      : 'border-[0.5px] border-ink/10 bg-paper text-ink'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{m.contenido}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      esMio ? 'text-bone/50' : 'text-ink/40'
                    }`}
                  >
                    {new Date(m.creado_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Escribe un mensaje..."
            rows={2}
            className="flex-1 resize-none rounded-xl border-[0.5px] border-ink/15 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-noema-sage focus:outline-none"
          />
          <button
            onClick={enviar}
            disabled={pending || !texto.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-noema-deep text-bone transition-opacity hover:bg-noema-deep/90 disabled:opacity-40"
            aria-label="Enviar mensaje"
          >
            <Send className="size-4" strokeWidth={1.8} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink/40">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
