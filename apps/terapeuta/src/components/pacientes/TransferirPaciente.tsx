'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, X } from 'lucide-react';
import { transferirPacienteAction } from '../../../app/(panel)/pacientes/[id]/transfer-actions';

/**
 * Transfiere el paciente (y su historial clínico) a otro terapeuta registrado
 * en NOEMA, usando la cédula profesional de ese terapeuta como código único.
 */
export function TransferirPaciente({
  vinculacionId,
  nombrePaciente,
}: {
  vinculacionId: string;
  nombrePaciente: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [cedula, setCedula] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const transferir = () => {
    setError(null);
    startTransition(async () => {
      const r = await transferirPacienteAction(vinculacionId, cedula, motivo);
      if (r.ok) {
        setAbierto(false);
        router.push('/pacientes');
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo transferir.');
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-noema-deep/30"
      >
        <ArrowRightLeft className="size-4" strokeWidth={1.7} />
        Transferir
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noema-deep/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">Transferir paciente</h2>
              <button
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="text-foreground-muted hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-foreground-muted">
              Transfiere a <span className="font-medium text-ink">{nombrePaciente}</span> y
              todo su historial clínico a otro terapeuta registrado en NOEMA. Necesitas su{' '}
              <span className="font-medium">cédula profesional</span> (su código único).
              Una vez transferido, tú dejarás de tener acceso.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-ink/80">
                  Cédula del terapeuta destino
                </label>
                <input
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej. 12345678"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink/80">Motivo (opcional)</label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. cambio de ciudad del paciente"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={transferir}
                  disabled={pending || !cedula.trim()}
                  className="rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                >
                  {pending ? 'Transfiriendo…' : 'Transferir paciente'}
                </button>
                <button
                  onClick={() => setAbierto(false)}
                  className="px-3 py-2.5 text-sm text-foreground-muted hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
