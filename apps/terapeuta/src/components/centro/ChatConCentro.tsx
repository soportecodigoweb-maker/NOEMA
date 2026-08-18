'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { responderCentroAction, marcarLeidosCentroAction } from '../../../app/(panel)/mi-centro/actions';

export interface MensajeCentro {
  id: string;
  cuerpo: string;
  deCentro: boolean;
  fecha: string;
}

/** Chat 1 a 1 entre el terapeuta y su centro. */
export function ChatConCentro({
  centroNombre,
  mensajes,
}: {
  centroNombre: string;
  mensajes: MensajeCentro[];
}) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [pending, startTransition] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);

  // Marcar como leídos al abrir y bajar al último mensaje.
  useEffect(() => {
    marcarLeidosCentroAction();
  }, []);
  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' });
  }, [mensajes.length]);

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    startTransition(async () => {
      await responderCentroAction(t);
      router.refresh();
    });
  };

  return (
    <div className="flex h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-noema-deep/10 bg-white">
      <div className="border-b border-noema-deep/[0.08] px-4 py-3">
        <p className="font-medium text-ink">{centroNombre}</p>
        <p className="text-xs text-foreground-muted">Conversación con la administración de tu centro</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-paper/30 p-4">
        {mensajes.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            Aún no hay mensajes. Escribe para iniciar la conversación.
          </p>
        ) : (
          mensajes.map((m) => (
            <div key={m.id} className={`flex ${m.deCentro ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.deCentro
                    ? 'rounded-tl-sm bg-white text-ink shadow-sm'
                    : 'rounded-tr-sm bg-noema-deep text-bone'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.cuerpo}</p>
                <p className={`mt-1 text-[10px] ${m.deCentro ? 'text-foreground-muted' : 'text-bone/60'}`}>
                  {m.fecha}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={finRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-noema-deep/[0.08] p-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          rows={1}
          placeholder="Escribe un mensaje…"
          className="max-h-32 min-h-[42px] flex-1 resize-y rounded-md border border-noema-deep/15 px-3 py-2.5 text-sm focus:border-noema-sage focus:outline-none"
        />
        <button
          onClick={enviar}
          disabled={pending || !texto.trim()}
          aria-label="Enviar"
          className="rounded-md bg-noema-deep p-2.5 text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}
