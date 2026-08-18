'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { confirmarIncorporacionAction } from '../../../app/centro/supervision-actions';

/** El centro confirma (o no) al terapeuta que ya aceptó el acuerdo. */
export function ConfirmarIncorporacion({ terapeutaId }: { terapeutaId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const responder = (acepta: boolean) => {
    startTransition(async () => {
      const r = await confirmarIncorporacionAction(terapeutaId, acepta);
      if (r.ok) router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => responder(true)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md bg-noema-deep px-3 py-1.5 text-xs font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
      >
        <Check className="size-3.5" /> {pending ? 'Confirmando…' : 'Confirmar incorporación'}
      </button>
      <button
        onClick={() => responder(false)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-foreground-muted hover:text-ink disabled:opacity-40"
      >
        <X className="size-3.5" /> Rechazar
      </button>
    </div>
  );
}
