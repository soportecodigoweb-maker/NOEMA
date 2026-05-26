'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { marcarRealizadaAction, cancelarSesionAction } from './actions';

interface Props {
  sesion: { id: string; estado: string };
  vinculacionId: string;
}

export function AccionesSesion({ sesion, vinculacionId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');

  if (sesion.estado === 'cancelada' || sesion.estado === 'realizada') {
    return null;
  }

  if (cancelando) {
    return (
      <div className="flex flex-col gap-2 w-72">
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional)"
          className="h-9 px-3 text-sm rounded-md border border-noema-deep/10 bg-bone"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCancelando(false)}
          >
            Atrás
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={isPending}
            onClick={() => startTransition(() => cancelarSesionAction(sesion.id, vinculacionId, motivo))}
          >
            Confirmar cancelación
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="md"
        onClick={() => setCancelando(true)}
        disabled={isPending}
      >
        Cancelar
      </Button>
      <Button
        variant="primary"
        size="md"
        loading={isPending}
        onClick={() => startTransition(() => marcarRealizadaAction(sesion.id, vinculacionId))}
      >
        Marcar realizada
      </Button>
    </div>
  );
}
