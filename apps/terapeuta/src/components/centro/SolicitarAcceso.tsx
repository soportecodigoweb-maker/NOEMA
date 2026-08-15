'use client';

import { useState, useTransition } from 'react';
import { Send, Clock } from 'lucide-react';
import { solicitarAccesoPacienteAction } from '../../../app/centro/supervision-actions';

export function SolicitarAcceso({
  vinculacionId,
  pendiente,
}: {
  vinculacionId: string;
  pendiente: boolean;
}) {
  const [enviada, setEnviada] = useState(pendiente);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const solicitar = () => {
    setError(null);
    startTransition(async () => {
      const r = await solicitarAccesoPacienteAction(vinculacionId);
      if (r.ok) setEnviada(true);
      else setError(r.error ?? 'No se pudo enviar.');
    });
  };

  if (enviada) {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-lg bg-noema-clay/[0.08] px-3 py-2 text-sm text-noema-clay">
        <Clock className="size-4" /> Solicitud enviada. Esperando la autorización del terapeuta.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={solicitar}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
      >
        <Send className="size-4" /> {loading ? 'Enviando…' : 'Solicitar acceso al terapeuta'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
