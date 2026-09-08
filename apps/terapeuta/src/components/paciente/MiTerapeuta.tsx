'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRound, Link2Off, AlertTriangle, Check } from 'lucide-react';
import { desvincularmeAction } from '../../../app/paciente/actions';

/** Muestra al paciente quién es su terapeuta y le permite desvincularse. */
export function MiTerapeuta({ terapeutaNombre }: { terapeutaNombre: string }) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const desvincular = () => {
    setError(null);
    startTransition(async () => {
      const r = await desvincularmeAction();
      if (r.ok) {
        setListo(true);
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo desvincular.');
      }
    });
  };

  return (
    <div className="rounded-2xl border border-noema-deep/10 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15 text-noema-deep/70">
          <UserRound className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Mi terapeuta</p>
          <p className="font-medium text-ink">{terapeutaNombre}</p>
        </div>
      </div>

      {listo ? (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-noema-sage/10 px-3 py-2 text-sm text-noema-sage">
          <Check className="size-4" /> Te desvinculaste. Puedes vincularte con otro terapeuta cuando quieras.
        </p>
      ) : !confirmar ? (
        <button
          onClick={() => setConfirmar(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-[#B85450]/40 px-3 py-1.5 text-sm font-medium text-[#B85450] hover:bg-[#B85450]/[0.06]"
        >
          <Link2Off className="size-4" /> Desvincularme
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-[#B85450]/25 bg-[#B85450]/[0.04] p-3">
          <p className="flex items-start gap-2 text-sm text-ink/85">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#B85450]" />
            <span>
              <span className="font-medium text-ink">¿Seguro que quieres desvincularte?</span> Tu
              terapeuta dejará de acompañarte y de ver tu proceso. Tu información se conserva, pero
              perderás el seguimiento hasta que te vincules de nuevo. Tu terapeuta recibirá aviso.
            </span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={desvincular}
              disabled={pending}
              className="rounded-md bg-[#B85450] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#B85450]/90 disabled:opacity-50"
            >
              {pending ? 'Desvinculando…' : 'Sí, desvincularme'}
            </button>
            <button
              onClick={() => setConfirmar(false)}
              className="px-2 py-1.5 text-sm text-foreground-muted hover:text-ink"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
