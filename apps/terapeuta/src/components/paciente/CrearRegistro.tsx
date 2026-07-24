'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { crearRegistroAction } from '../../../app/paciente/actions';
import { iconoDeEmocion } from './IconoEmocion';

interface Emocion {
  key: string;
  nombre_es: string;
  familia: string;
}

export function CrearRegistro({ emociones }: { emociones: Emocion[] }) {
  const [abierto, setAbierto] = useState(false);
  const [emocion, setEmocion] = useState('');
  const [intensidad, setIntensidad] = useState(3);
  const [privacidad, setPrivacidad] = useState('privado');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const enviar = (formData: FormData) => {
    formData.set('emocion', emocion);
    formData.set('intensidad', String(intensidad));
    formData.set('privacidad', privacidad);
    setError(null);
    startTransition(async () => {
      const res = await crearRegistroAction(formData);
      if (res.ok) {
        setAbierto(false);
        setEmocion('');
        setIntensidad(3);
      } else {
        setError(res.error ?? 'Error');
      }
    });
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-noema-deep px-5 py-4 text-base font-medium text-bone shadow-sm transition-colors hover:bg-noema-deep/90"
      >
        <Plus className="size-5" strokeWidth={2} />
        Registrar cómo me siento
      </button>
    );
  }

  return (
    <form action={enviar} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
      <h3 className="font-serif text-lg text-ink">¿Cómo te sientes?</h3>

      <div>
        <label className="mb-2 block text-sm text-ink/70">Emoción</label>
        <div className="flex flex-wrap gap-2">
          {emociones.map((e) => {
            const Icono = iconoDeEmocion(e.key, e.familia);
            return (
              <button
                key={e.key}
                type="button"
                onClick={() => setEmocion(e.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  emocion === e.key
                    ? 'border-noema-deep bg-noema-deep text-bone'
                    : 'border-ink/15 text-ink/70 hover:border-noema-sage'
                }`}
              >
                <Icono className="size-4" strokeWidth={1.7} />
                {e.nombre_es}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink/70">Intensidad: {intensidad}/5</label>
        <input
          type="range"
          min={1}
          max={5}
          value={intensidad}
          onChange={(e) => setIntensidad(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink/70">¿Qué lo detonó? (opcional)</label>
        <input
          name="situacion"
          placeholder="Ej. Trabajo, Familia, Pareja…"
          className="w-full rounded-md border border-ink/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink/70">Describe (opcional)</label>
        <textarea
          name="descripcion"
          rows={2}
          placeholder="Lo que quieras anotar…"
          className="w-full rounded-md border border-ink/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink/70">Privacidad</label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: 'privado', l: 'Privado (solo yo)' },
            { v: 'compartido', l: 'Compartir con mi terapeuta' },
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
          disabled={pending || !emocion}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Guardando…' : 'Guardar registro'}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-foreground-muted">
          Cancelar
        </button>
      </div>
    </form>
  );
}
