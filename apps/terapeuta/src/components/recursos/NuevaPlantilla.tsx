'use client';

import { useState, useTransition } from 'react';
import { Plus, X, FolderHeart, FolderLock } from 'lucide-react';
import { crearPlantillaAction } from '../../../app/(panel)/recursos/actions';
import {
  EditorPreguntas,
  aCamposGuardados,
  type PreguntaBorrador,
} from './EditorPreguntas';

export function NuevaPlantilla() {
  const [open, setOpen] = useState(false);
  const [destino, setDestino] = useState<'paciente' | 'terapeuta'>('paciente');
  const [preguntas, setPreguntas] = useState<PreguntaBorrador[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setDestino('paciente');
    setPreguntas([]);
    setError(null);
  };

  const onSubmit = (formData: FormData) => {
    setError(null);
    formData.set('destino', destino);
    formData.set('campos', JSON.stringify(aCamposGuardados(preguntas)));
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-noema-deep/40 p-4">
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">Nuevo recurso o formato</h2>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                aria-label="Cerrar"
                className="text-foreground-muted hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={onSubmit} className="space-y-4">
              {/* Carpeta destino */}
              <div>
                <label className="mb-1.5 block text-sm text-ink/80">Carpeta</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDestino('paciente')}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      destino === 'paciente'
                        ? 'border-noema-sage bg-noema-sage/10 text-ink'
                        : 'border-noema-deep/15 text-ink/70'
                    }`}
                  >
                    <FolderHeart className="size-4 shrink-0 text-noema-sage" strokeWidth={1.7} />
                    Para pacientes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestino('terapeuta')}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      destino === 'terapeuta'
                        ? 'border-noema-deep bg-noema-deep/8 text-ink'
                        : 'border-noema-deep/15 text-ink/70'
                    }`}
                  >
                    <FolderLock className="size-4 shrink-0 text-noema-deep" strokeWidth={1.7} />
                    Uso del terapeuta
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-ink/80">Título</label>
                <input
                  name="titulo"
                  required
                  placeholder="Ej. Registro de pensamientos, consentimiento…"
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
              {destino === 'paciente' && (
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Categoría</label>
                  <input
                    name="categoria"
                    defaultValue="general"
                    placeholder="general, ansiedad, respiración…"
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm text-ink/80">
                  {destino === 'terapeuta' ? 'Contenido del formato' : 'Instrucciones / contenido'}
                </label>
                <textarea
                  name="contenido"
                  rows={5}
                  placeholder="Instrucciones, formato, texto del recurso…"
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              </div>

              {/* Preguntas para el paciente (solo recursos de paciente) */}
              {destino === 'paciente' && (
                <EditorPreguntas preguntas={preguntas} onChange={setPreguntas} />
              )}

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
