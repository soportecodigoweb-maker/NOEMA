'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

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
  const [kbInset, setKbInset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const irAlFondo = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  };

  // El teclado móvil se superpone al viewport (no lo encoge), así que el
  // composer quedaba tapado la primera vez. Con la VisualViewport API levantamos
  // el contenedor justo por encima del teclado.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const ajustar = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset);
      irAlFondo();
    };
    vv.addEventListener('resize', ajustar);
    vv.addEventListener('scroll', ajustar);
    return () => {
      vv.removeEventListener('resize', ajustar);
      vv.removeEventListener('scroll', ajustar);
    };
  }, []);

  const supabase = createBrowserClient();

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

  const inicial = terapeutaNombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    // Pantalla completa tipo WhatsApp. En móvil se fija al viewport bajo la barra
    // superior (top-[52px]) para que NO se mueva al hacer scroll y el composer
    // quede pegado abajo. En desktop es una columna normal de altura completa.
    <div
      className="fixed inset-x-0 bottom-0 top-[52px] z-30 flex flex-col bg-paper lg:static lg:inset-auto lg:top-auto lg:z-auto lg:h-screen"
      style={kbInset ? { bottom: kbInset } : undefined}
    >
      {/* Cabecera compacta */}
      <header className="flex shrink-0 items-center gap-3 border-b border-ink/10 bg-white px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-noema-sage/15 text-sm font-medium text-noema-deep/70">
          {inicial}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{terapeutaNombre}</p>
          <p className="text-[11px] text-ink/50">Te responderá cuando pueda</p>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {mensajes.length === 0 ? (
          <p className="pt-10 text-center text-sm text-ink/50">
            Aún no hay mensajes. Escribe uno para comenzar.
          </p>
        ) : (
          mensajes.map((m) => {
            const esMio = m.autor_id === userId;
            return (
              <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm ${
                    esMio
                      ? 'rounded-br-sm bg-noema-deep text-bone'
                      : 'rounded-bl-sm border-[0.5px] border-ink/10 bg-white text-ink'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{m.contenido}</p>
                  <p className={`mt-0.5 text-right text-[10px] ${esMio ? 'text-bone/50' : 'text-ink/40'}`}>
                    {new Date(m.creado_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Mexico_City',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer fijo abajo */}
      <div className="shrink-0 border-t border-ink/10 bg-white px-3 py-2.5">
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
            onFocus={() => setTimeout(irAlFondo, 300)}
            placeholder="Escribe un mensaje…"
            rows={1}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border-[0.5px] border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-noema-sage focus:outline-none"
          />
          <button
            onClick={enviar}
            disabled={pending || !texto.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-deep text-bone transition-opacity hover:bg-noema-deep/90 disabled:opacity-40"
            aria-label="Enviar mensaje"
          >
            <Send className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
