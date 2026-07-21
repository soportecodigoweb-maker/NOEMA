'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, KeyRound } from 'lucide-react';
import { redimirCodigoAction } from '../../../app/paciente/actions';

export function VincularTerapeuta() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const vincular = () => {
    setError(null);
    startTransition(async () => {
      const res = await redimirCodigoAction(codigo);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudo vincular.');
      }
    });
  };

  return (
    <div className="rounded-2xl border-[0.5px] border-ink/10 bg-white p-8">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
          <Link2 className="size-6 text-noema-sage" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-ink">Aún no tienes un terapeuta vinculado</h2>
          <p className="mt-2 text-sm text-ink/70">
            Si tu terapeuta te dio un código de invitación, ingrésalo aquí para
            conectar tu cuenta con la suya.
          </p>

          {!abierto ? (
            <button
              onClick={() => setAbierto(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone transition-colors hover:bg-noema-deep/90"
            >
              <KeyRound className="size-4" strokeWidth={1.8} />
              Vincularme con mi terapeuta
            </button>
          ) : (
            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-ink">
                Código de tu terapeuta
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && vincular()}
                  placeholder="NOEMA-XXXX"
                  className="flex-1 rounded-md border border-ink/15 bg-bone px-4 py-2.5 text-sm uppercase tracking-wider focus:border-noema-sage focus:outline-none"
                />
                <button
                  onClick={vincular}
                  disabled={pending || codigo.trim().length < 4}
                  className="rounded-md bg-noema-deep px-5 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                >
                  {pending ? 'Vinculando…' : 'Vincular'}
                </button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-xs text-ink/50">
                El código tiene el formato NOEMA seguido de 4 caracteres. Te lo
                comparte tu terapeuta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
