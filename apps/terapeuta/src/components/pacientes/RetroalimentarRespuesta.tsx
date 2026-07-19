'use client';

import { useState, useTransition } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { dejarRetroalimentacionAction } from '../../../app/(panel)/pacientes/[id]/ejercicios/feedback-actions';

export function RetroalimentarRespuesta({
  respuestaId,
  vinculacionId,
  inicial,
}: {
  respuestaId: string;
  vinculacionId: string;
  inicial: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState(inicial ?? '');
  const [guardado, setGuardado] = useState<string | null>(inicial);
  const [pending, startTransition] = useTransition();

  const guardar = () => {
    startTransition(async () => {
      const res = await dejarRetroalimentacionAction(respuestaId, vinculacionId, texto);
      if (res.ok) {
        setGuardado(texto.trim() || null);
        setAbierto(false);
      }
    });
  };

  if (!abierto) {
    return (
      <div className="mt-2">
        {guardado ? (
          <div className="rounded-md bg-noema-sage/10 px-3 py-2 text-sm">
            <p className="text-[11px] uppercase tracking-wider text-noema-deep/60">
              Tu retroalimentación
            </p>
            <p className="text-ink/80">{guardado}</p>
            <button
              onClick={() => setAbierto(true)}
              className="mt-1 text-xs text-noema-sage hover:underline"
            >
              Editar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAbierto(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-noema-sage hover:underline"
          >
            <MessageSquarePlus className="size-3.5" strokeWidth={1.8} />
            Dar retroalimentación
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        placeholder="Un comentario breve para tu paciente sobre esta respuesta…"
        aria-label="Retroalimentación"
        className="w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={guardar}
          disabled={pending}
          className="rounded-md bg-noema-deep px-3 py-1.5 text-xs font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          onClick={() => setAbierto(false)}
          className="text-xs text-foreground-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
