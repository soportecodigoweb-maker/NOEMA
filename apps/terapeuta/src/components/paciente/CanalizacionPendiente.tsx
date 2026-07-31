'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, ShieldCheck, Check } from 'lucide-react';
import { responderCanalizacionAction } from '../../../app/paciente/canalizacion-actions';

interface Props {
  id: string;
  destinoNombre: string | null;
}

/**
 * Ventana importante para el paciente: su terapeuta quiere canalizarlo con otro
 * profesional. Debe autorizar el envío de su información. Al aceptar, se muestra
 * un aviso de privacidad sobre el nuevo terapeuta.
 */
export function CanalizacionPendiente({ id, destinoNombre }: Props) {
  const router = useRouter();
  const [fase, setFase] = useState<'decision' | 'aceptado'>('decision');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const destino = destinoNombre ? destinoNombre : 'otro terapeuta';

  const responder = (acepta: boolean) => {
    setError(null);
    startTransition(async () => {
      const r = await responderCanalizacionAction(id, acepta);
      if (!r.ok) {
        setError(r.error ?? 'No se pudo procesar.');
        return;
      }
      if (acepta) {
        setFase('aceptado');
      } else {
        router.refresh();
      }
    });
  };

  const cerrar = () => {
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-noema-deep/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {fase === 'decision' ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-noema-clay/15">
                <ArrowRightLeft className="size-5 text-noema-clay" strokeWidth={1.7} />
              </div>
              <h2 className="font-serif text-xl text-ink">Solicitud de canalización</h2>
            </div>

            <p className="text-sm leading-relaxed text-ink/80">
              Tu terapeuta desea <span className="font-medium text-ink">canalizarte con {destino}</span> y enviarle
              un informe de tu proceso para dar continuidad a tu acompañamiento.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              Para que esto ocurra, necesitamos <span className="font-medium text-ink">tu autorización</span>. Tú
              decides si aceptas que tu información se comparta con este nuevo terapeuta.
            </p>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => responder(true)}
                disabled={pending}
                className="w-full rounded-md bg-noema-deep px-4 py-3 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
              >
                {pending ? 'Procesando…' : 'Sí, autorizo la canalización'}
              </button>
              <button
                onClick={() => responder(false)}
                disabled={pending}
                className="w-full rounded-md border border-noema-deep/15 px-4 py-2.5 text-sm text-ink hover:border-noema-deep/30 disabled:opacity-40"
              >
                No autorizo
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
                <ShieldCheck className="size-5 text-noema-sage" strokeWidth={1.7} />
              </div>
              <h2 className="font-serif text-xl text-ink">Canalización completada</h2>
            </div>
            <p className="text-sm leading-relaxed text-ink/80">
              Tu información fue enviada a <span className="font-medium text-ink">{destino}</span>, quien ahora
              acompañará tu proceso.
            </p>
            <div className="mt-3 rounded-xl border border-noema-sage/25 bg-noema-sage/[0.06] p-4 text-sm leading-relaxed text-ink/80">
              <p className="mb-1 font-medium text-ink">Aviso de privacidad</p>
              Este terapeuta manejará tu información con estricta confidencialidad, conforme a la Ley Federal de
              Protección de Datos Personales (LFPDPPP), y únicamente para tu acompañamiento terapéutico. Tú sigues
              decidiendo qué compartes y qué mantienes privado.
            </div>
            <button
              onClick={cerrar}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-noema-deep px-4 py-3 text-sm font-medium text-bone hover:bg-noema-deep/90"
            >
              <Check className="size-4" /> Entendido
            </button>
          </>
        )}
      </div>
    </div>
  );
}
