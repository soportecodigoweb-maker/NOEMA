'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check } from 'lucide-react';
import { responderInvitacionCentroAction } from '../../../app/(panel)/ajustes/centro-actions';

/** Modal: un centro invitó al terapeuta a formar parte de su equipo. */
export function InvitacionCentroPendiente({
  centroId,
  centroNombre,
}: {
  centroId: string;
  centroNombre: string;
}) {
  const router = useRouter();
  const [oculto, setOculto] = useState(false);
  const [pending, startTransition] = useTransition();

  if (oculto) return null;

  const responder = (acepta: boolean) => {
    startTransition(async () => {
      await responderInvitacionCentroAction(centroId, acepta);
      setOculto(true);
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-noema-deep/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
            <Building2 className="size-5 text-noema-sage" strokeWidth={1.7} />
          </div>
          <h2 className="font-serif text-xl text-ink">Invitación a un centro</h2>
        </div>

        <p className="text-sm leading-relaxed text-ink/80">
          <span className="font-medium text-ink">{centroNombre}</span> te invitó a formar parte de su
          equipo de terapeutas.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">
          Si aceptas, el centro podrá ver cuántos pacientes atiendes y gestionar tu colaboración. El
          acceso al proceso clínico de tus pacientes seguirá requiriendo{' '}
          <span className="font-medium text-ink">tu autorización</span>.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => responder(true)}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-noema-deep px-4 py-3 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            <Check className="size-4" /> {pending ? 'Procesando…' : 'Aceptar invitación'}
          </button>
          <button
            onClick={() => responder(false)}
            disabled={pending}
            className="w-full rounded-md border border-noema-deep/15 px-4 py-2.5 text-sm text-ink hover:border-noema-deep/30 disabled:opacity-40"
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
}
