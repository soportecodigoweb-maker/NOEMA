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
              Borra tu cuenta y todos tus datos de forma permanente. Esta acción no se
              puede deshacer.
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
                <div className="flex gap-2">
                  <button
                    onClick={eliminar}
                    disabled={pending || texto.trim().toUpperCase() !== 'ELIMINAR'}
                    className="rounded-md bg-noema-clay px-4 py-2 text-sm font-medium text-white hover:bg-noema-clay/90 disabled:opacity-40"
                  >
                    {pending ? 'Eliminando…' : 'Eliminar definitivamente'}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
