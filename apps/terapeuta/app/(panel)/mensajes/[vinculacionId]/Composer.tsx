'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { enviarMensajeAction } from './actions';
import { MENSAJES_PREESTABLECIDOS } from '@/lib/mensajes-preestablecidos';

export function Composer({ vinculacionId }: { vinculacionId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mostrarPresets, setMostrarPresets] = useState(false);
  const [isPending, startTransition] = useTransition();

  const send = () => {
    if (!text.trim()) return;
    const t = text;
    setText('');
    setError(null);
    startTransition(async () => {
      const r = await enviarMensajeAction(vinculacionId, t);
      if (!r.ok) {
        setText(t); // restaurar si falló
        setError('No se pudo enviar. Intenta de nuevo.');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      {/* Mensajes preestablecidos (req #2) */}
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
          <p className="px-3 py-1 text-[11px] text-foreground-muted">
            Elige uno para editarlo antes de enviar. (Redactar con IA se
            habilitará al conectar la cuenta de IA.)
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2"
      >
        <button
          type="button"
          onClick={() => setMostrarPresets((v) => !v)}
          aria-label="Mensajes preestablecidos"
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
              send();
            }
          }}
          placeholder="Escribe tu mensaje… (Enter para enviar, Shift+Enter nueva línea)"
          aria-label="Mensaje para el paciente"
          rows={1}
          className="min-h-[44px] max-h-[200px] flex-1 resize-none rounded-md border border-noema-deep/10 bg-bone px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/35 focus:border-noema-sage focus:outline-none focus:ring-1 focus:ring-noema-sage"
          style={{ fieldSizing: 'content' as any }}
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
  );
}
