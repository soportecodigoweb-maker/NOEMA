'use client';

import { useTransition } from 'react';
import { marcarPagadoAction } from '../../../app/(panel)/finanzas/actions';

export function MarcarPagado({ pagoId }: { pagoId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => { marcarPagadoAction(pagoId); })}
      disabled={pending}
      className="shrink-0 rounded-md bg-noema-sage px-3 py-1.5 text-xs font-medium text-bone hover:bg-noema-deep disabled:opacity-50"
    >
      {pending ? '…' : 'Marcar pagado'}
    </button>
  );
}
