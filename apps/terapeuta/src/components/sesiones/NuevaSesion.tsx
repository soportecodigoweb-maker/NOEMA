'use client';

import { useState, useTransition } from 'react';
import { CalendarPlus, X } from 'lucide-react';
import { agendarSesionAction } from '../../../app/(panel)/sesiones/actions';

export interface PacienteOption {
  vinculacionId: string;
  nombre: string;
}

export function NuevaSesion({ pacientes }: { pacientes: PacienteOption[] }) {
  const [open, setOpen] = useState(false);
  const [modalidad, setModalidad] = useState('online');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await agendarSesionAction(formData);
      if (res.ok) {
        setOpen(false);
      } else {
        setError(res.error ?? 'No se pudo agendar.');
      }
    });
  };

  if (pacientes.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone transition-colors hover:bg-noema-deep/90"
      >
        <CalendarPlus className="size-4" strokeWidth={1.8} />
        Agendar sesión
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noema-deep/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-ink">Agendar sesión</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-foreground-muted hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <form action={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-ink/80">Paciente</label>
                <select
                  name="vinculacionId"
                  required
                  className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                >
                  <option value="">Selecciona…</option>
                  {pacientes.map((p) => (
                    <option key={p.vinculacionId} value={p.vinculacionId}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    required
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Hora</label>
                  <input
                    type="time"
                    name="hora"
                    required
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Duración (min)</label>
                  <input
                    type="number"
                    name="duracion"
                    defaultValue={60}
                    min={15}
                    step={15}
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Modalidad</label>
                  <select
                    name="modalidad"
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  >
                    <option value="online">Videollamada</option>
                    <option value="presencial">Presencial</option>
                    <option value="hibrida">Híbrida</option>
                  </select>
                </div>
              </div>

              {modalidad !== 'presencial' && (
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Link de videollamada</label>
                  <input
                    type="url"
                    name="link"
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
              )}

              {modalidad !== 'online' && (
                <div>
                  <label className="mb-1 block text-sm text-ink/80">Ubicación</label>
                  <input
                    type="text"
                    name="ubicacion"
                    placeholder="Consultorio, dirección…"
                    className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone transition-opacity hover:bg-noema-deep/90 disabled:opacity-50"
              >
                {pending ? 'Agendando…' : 'Agendar sesión'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
