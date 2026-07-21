'use client';

import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { registrarPagoAction } from '../../../app/(panel)/finanzas/actions';

export function RegistrarPago({
  pacientes,
}: {
  pacientes: { vinculacionId: string; nombre: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await registrarPagoAction(formData);
      if (res.ok) setOpen(false);
      else setError(res.error ?? 'Error');
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
      >
        <Plus className="size-4" strokeWidth={2} />
        Registrar pago
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noema-deep/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">Registrar pago</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                <X className="size-5" />
              </button>
            </div>

            <form action={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-ink/80">Paciente</label>
                <select
                  name="vinculacionId"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                >
                  <option value="">General / sin paciente</option>
                  {pacientes.map((p) => (
                    <option key={p.vinculacionId} value={p.vinculacionId}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Monto (MXN)</label>
                  <input
                    type="number"
                    name="monto"
                    required
                    min={1}
                    step="0.01"
                    placeholder="800.00"
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink/80">Concepto</label>
                <input
                  name="concepto"
                  placeholder="Sesión de seguimiento, mensualidad…"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Método</label>
                  <select
                    name="metodo"
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Estado</label>
                  <select
                    name="estado"
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
              >
                {pending ? 'Guardando…' : 'Registrar pago'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
