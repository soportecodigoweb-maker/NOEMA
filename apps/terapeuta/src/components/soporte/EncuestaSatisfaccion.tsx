'use client';

import { useState, useTransition } from 'react';
import { Star, X, Check } from 'lucide-react';
import { enviarEncuestaAction } from '../../../app/encuesta-actions';

/**
 * Encuesta de satisfacción ocasional. El servidor decide `mostrar` (p. ej. si
 * el usuario no ha respondido en las últimas 2 semanas). La respuesta llega al
 * Panel de Dueño de NOEMA.
 */
export function EncuestaSatisfaccion({ mostrar }: { mostrar: boolean }) {
  const [oculto, setOculto] = useState(false);
  const [calif, setCalif] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!mostrar || oculto) return null;

  const enviar = () => {
    if (calif < 1) return;
    startTransition(async () => {
      const r = await enviarEncuestaAction(calif, comentario);
      if (r.ok) setEnviado(true);
    });
  };

  return (
    <div className="fixed bottom-20 right-4 z-30 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-noema-deep/10 bg-white p-5 shadow-xl">
      <button
        onClick={() => setOculto(true)}
        aria-label="Cerrar"
        className="absolute right-3 top-3 text-foreground-muted hover:text-ink"
      >
        <X className="size-4" />
      </button>

      {enviado ? (
        <div className="py-2 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-noema-sage/15">
            <Check className="size-5 text-noema-sage" />
          </div>
          <p className="mt-2 text-sm text-ink/80">¡Gracias por tu retroalimentación!</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-ink">¿Qué tan satisfecho estás con NOEMA?</p>
          <p className="mb-3 text-xs text-foreground-muted">Tu opinión nos ayuda a mejorar.</p>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setCalif(n)} aria-label={`${n} estrellas`}>
                <Star
                  className={`size-7 transition-colors ${
                    n <= calif ? 'fill-noema-clay text-noema-clay' : 'text-noema-deep/20'
                  }`}
                  strokeWidth={1.6}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder="¿Algo que quieras contarnos? (opcional)"
            className="mb-3 w-full rounded-md border border-noema-deep/15 px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
          />
          <button
            onClick={enviar}
            disabled={pending || calif < 1}
            className="w-full rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            {pending ? 'Enviando…' : 'Enviar'}
          </button>
        </>
      )}
    </div>
  );
}
