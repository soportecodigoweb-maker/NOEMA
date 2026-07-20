'use client';

import { useState, useTransition } from 'react';
import { crearDiarioAction } from '../../../app/paciente/actions';

export function CrearDiario() {
  const [abierto, setAbierto] = useState(false);
  const [privacidad, setPrivacidad] = useState('privado');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const enviar = (formData: FormData) => {
    formData.set('privacidad', privacidad);
    setError(null);
    startTransition(async () => {
      const res = await crearDiarioAction(formData);
      if (res.ok) setAbierto(false);
      else setError(res.error ?? 'Error');
    });
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
      >
        + Escribir
      </button>
    );
  }

  return (
    <form action={enviar} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
      <input
        name="titulo"
        placeholder="Título (opcional)"
        className="w-full rounded-md border border-ink/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
      />
      <textarea
        name="contenido"
        rows={6}
        placeholder="Escribe lo que necesites. Este es tu espacio."
        className="w-full rounded-md border border-ink/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
      />
      <div>
        <label className="mb-1 block text-sm text-ink/70">Privacidad</label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'privado', l: 'Privado (solo yo)' },
            { v: 'compartido', l: 'Compartir con terapeuta' },
            { v: 'marcado_sesion', l: 'Marcar para sesión' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setPrivacidad(o.v)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                privacidad === o.v
                  ? 'border-noema-sage bg-noema-sage/15 text-noema-deep'
                  : 'border-ink/15 text-ink/60 hover:border-noema-sage'
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-foreground-muted">
          Cancelar
        </button>
      </div>
    </form>
  );
}
