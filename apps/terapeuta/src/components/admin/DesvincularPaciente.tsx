'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Link2Off, Check, AlertTriangle } from 'lucide-react';
import { desvincularPacienteAdminAction } from '../../../app/admin/vincular-actions';

/** Muestra el terapeuta del paciente y permite desvincularlo (con confirmación). */
export function DesvincularPaciente({
  vinculacionId,
  terapeutaNombre,
}: {
  vinculacionId: string;
  terapeutaNombre: string;
}) {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const desvincular = () => {
    setError(null);
    startTransition(async () => {
      const r = await desvincularPacienteAdminAction(vinculacionId);
      if (r.ok) {
        setListo(true);
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo desvincular.');
      }
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-1 font-serif text-lg text-ink">Terapeuta asignado</h2>
      <p className="mb-3 text-sm text-ink">{terapeutaNombre}</p>

      {listo ? (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-noema-sage/10 px-3 py-2 text-sm text-noema-sage">
          <Check className="size-4" /> Paciente desvinculado.
        </p>
      ) : !confirmar ? (
        <button
          onClick={() => setConfirmar(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#B85450]/40 px-3 py-1.5 text-sm font-medium text-[#B85450] hover:bg-[#B85450]/[0.06]"
        >
          <Link2Off className="size-4" /> Desvincular manualmente
        </button>
      ) : (
        <div className="rounded-xl border border-[#B85450]/25 bg-[#B85450]/[0.04] p-3">
          <p className="flex items-start gap-2 text-sm text-ink/85">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#B85450]" />
            Se cerrará el vínculo entre este paciente y su terapeuta. El paciente quedará sin
            terapeuta y ambos recibirán aviso. Esta acción no borra información.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={desvincular}
              disabled={pending}
              className="rounded-md bg-[#B85450] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#B85450]/90 disabled:opacity-50"
            >
              {pending ? 'Desvinculando…' : 'Sí, desvincular'}
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
    </section>
  );
}
