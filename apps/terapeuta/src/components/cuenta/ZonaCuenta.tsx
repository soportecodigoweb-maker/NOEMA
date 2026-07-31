'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { signOutAction } from '../../../app/(auth)/actions';
import { eliminarCuentaAction } from '../../../app/(auth)/account-actions';

/**
 * Cierre de sesión y eliminación de cuenta. Se usa igual para terapeuta y
 * paciente. La eliminación pide escribir ELIMINAR y es irreversible.
 */
export function ZonaCuenta() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const eliminar = () => {
    setError(null);
    startTransition(async () => {
      const r = await eliminarCuentaAction(texto);
      if (r.ok) {
        router.push('/signin');
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo eliminar.');
      }
    });
  };

  return (
    <div className="space-y-4">
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 px-4 py-2.5 text-sm font-medium text-ink hover:border-noema-deep/30"
        >
          <LogOut className="size-4" strokeWidth={1.7} />
          Cerrar sesión
        </button>
      </form>

      <div className="rounded-xl border border-noema-clay/30 bg-noema-clay/[0.04] p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-noema-clay" strokeWidth={1.8} />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">Eliminar mi cuenta</p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Tu información deja de ser accesible para tu terapeuta y para ti de inmediato,
              y no podrás volver a iniciar sesión. Por obligaciones legales, cierta
              información se conserva bloqueada un tiempo y luego se elimina. No se puede
              deshacer.
            </p>

            {!abierto ? (
              <button
                onClick={() => setAbierto(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-noema-clay/40 px-3 py-2 text-sm font-medium text-noema-clay hover:bg-noema-clay/10"
              >
                <Trash2 className="size-4" strokeWidth={1.8} />
                Eliminar cuenta
              </button>
            ) : (
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-ink/70">
                  Escribe <span className="font-semibold">ELIMINAR</span> para confirmar:
                </label>
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="ELIMINAR"
                  className="w-full max-w-xs rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-clay focus:outline-none"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}

                {!confirmando ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmando(true)}
                      disabled={texto.trim().toUpperCase() !== 'ELIMINAR'}
                      className="rounded-md bg-noema-clay px-4 py-2 text-sm font-medium text-white hover:bg-noema-clay/90 disabled:opacity-40"
                    >
                      Eliminar definitivamente
                    </button>
                    <button
                      onClick={() => {
                        setAbierto(false);
                        setTexto('');
                        setError(null);
                      }}
                      className="rounded-md px-3 py-2 text-sm text-foreground-muted hover:text-ink"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-noema-clay/40 bg-noema-clay/[0.06] p-3">
                    <p className="text-sm font-medium text-ink">
                      ¿Seguro que quieres eliminar tu cuenta?
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      Perderás el acceso de inmediato y tu terapeuta dejará de ver tu
                      información. Se conservará bloqueada por el periodo que la ley exige y
                      luego se eliminará. <span className="font-semibold">No se puede deshacer</span>.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={eliminar}
                        disabled={pending}
                        className="rounded-md bg-noema-clay px-4 py-2 text-sm font-medium text-white hover:bg-noema-clay/90 disabled:opacity-40"
                      >
                        {pending ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
                      </button>
                      <button
                        onClick={() => setConfirmando(false)}
                        disabled={pending}
                        className="rounded-md px-3 py-2 text-sm text-foreground-muted hover:text-ink"
                      >
                        No, volver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
