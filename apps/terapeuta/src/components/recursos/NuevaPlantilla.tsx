'use client';

import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { crearPlantillaAction } from '../../../app/(panel)/recursos/actions';

export function NuevaPlantilla() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await crearPlantillaAction(formData);
      // Si tiene éxito, la action redirige; si falla, muestra error.
      if (res && !res.ok) setError(res.error ?? 'Error');
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
      >
        <Plus className="size-4" strokeWidth={2} />
        Nuevo recurso
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noema-deep/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">Nuevo recurso o formato</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                <X className="size-5" />
              </button>
            </div>

            <form action={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-ink/80">Título</label>
                <input
                  name="titulo"
                  required
                  placeholder="Ej. Hoja de tarea, formato de consentimiento…"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink/80">Descripción (opcional)</label>
                <input
                  name="descripcion"
                  placeholder="Breve descripción"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink/80">Categoría</label>
                <input
                  name="categoria"
                  defaultValue="general"
                  placeholder="general, formato_nom004, relajacion…"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-ink/80">Contenido</label>
                <textarea
                  name="contenido"
                  rows={6}
                  placeholder="Instrucciones, formato, texto del recurso…"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
              >
                {pending ? 'Creando…' : 'Crear recurso'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
