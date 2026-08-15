'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Check } from 'lucide-react';
import { autorizarSupervisionGeneralAction } from '../../../app/supervision-terapeuta-actions';

/**
 * Modal para el terapeuta: su centro activó supervisión clínica y pide su
 * autorización para acceder a la información de sus pacientes. Se muestra hasta
 * que autorice (o lo posponga en la sesión).
 */
export function SupervisionPendiente({
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

  const responder = (autoriza: boolean) => {
    startTransition(async () => {
      await autorizarSupervisionGeneralAction(centroId, autoriza);
      if (autoriza) router.refresh();
      else setOculto(true);
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-noema-deep/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
            <Eye className="size-5 text-noema-sage" strokeWidth={1.7} />
          </div>
          <h2 className="font-serif text-xl text-ink">Supervisión clínica</h2>
        </div>

        <p className="text-sm leading-relaxed text-ink/80">
          <span className="font-medium text-ink">{centroNombre}</span> realiza supervisión clínica y
          solicita tu autorización para acceder a la información de tus pacientes con fines de
          supervisión.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">
          Si autorizas, el encargado del centro podrá consultar el proceso de tus pacientes cuando lo
          necesite. <span className="font-medium text-ink">Cada acceso queda registrado y recibirás
          un aviso con la fecha y hora.</span>
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => responder(true)}
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-noema-deep px-4 py-3 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            <Check className="size-4" /> {pending ? 'Procesando…' : 'Autorizar supervisión'}
          </button>
          <button
            onClick={() => responder(false)}
            disabled={pending}
            className="w-full rounded-md border border-noema-deep/15 px-4 py-2.5 text-sm text-ink hover:border-noema-deep/30 disabled:opacity-40"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
