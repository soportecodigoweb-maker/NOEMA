'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { enviarMensajeAction } from './actions';

export function Composer({ vinculacionId }: { vinculacionId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();

  const send = () => {
    if (!text.trim()) return;
    const t = text;
    setText('');
    startTransition(async () => {
      const r = await enviarMensajeAction(vinculacionId, t);
      if (!r.ok) setText(t); // restaurar si falló
      else router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex gap-2 items-end"
    >
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
        rows={1}
        className="flex-1 resize-none rounded-md border border-noema-deep/10 bg-bone px-4 py-2.5 text-[15px] text-ink placeholder:text-ink/35 focus:outline-none focus:border-noema-sage focus:ring-1 focus:ring-noema-sage min-h-[44px] max-h-[200px]"
        style={{ fieldSizing: 'content' as any }}
      />
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isPending}
        disabled={!text.trim()}
      >
        <Send className="size-4" strokeWidth={1.8} />
      </Button>
    </form>
  );
}
