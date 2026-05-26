'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import { guardarNotasAction } from './actions';

interface Props {
  vinculacionId: string;
  initial: string;
}

type Status = 'idle' | 'saving' | 'saved' | 'dirty';

export function NotasEditor({ vinculacionId, initial }: Props) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<Status>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save con debounce de 1.5s
  useEffect(() => {
    if (value === initial && status === 'idle') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('dirty');
    timerRef.current = setTimeout(async () => {
      setStatus('saving');
      const r = await guardarNotasAction(vinculacionId, value);
      setStatus(r.ok ? 'saved' : 'idle');
      if (r.ok) {
        setTimeout(() => setStatus('idle'), 1500);
      }
    }, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="caption">Editor con guardado automático</p>
        <span className="text-xs text-foreground-muted inline-flex items-center gap-1">
          {status === 'dirty' && 'Sin guardar'}
          {status === 'saving' && (
            <>
              <Loader2 className="size-3 animate-spin" />
              Guardando…
            </>
          )}
          {status === 'saved' && (
            <>
              <Check className="size-3 text-noema-sage" />
              Guardado
            </>
          )}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Observaciones clínicas, hipótesis, decisiones, contexto familiar, alertas…"
        className="min-h-[400px] leading-relaxed"
      />
    </div>
  );
}
