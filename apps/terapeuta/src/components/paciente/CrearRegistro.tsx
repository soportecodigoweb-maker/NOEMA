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
  // Ahora se pueden elegir varias emociones a la vez.
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [otroActivo, setOtroActivo] = useState(false);
  const [otroTexto, setOtroTexto] = useState('');
  const [intensidad, setIntensidad] = useState(3);
  const [privacidad, setPrivacidad] = useState('privado');
  const [error, setError] = useState<string | null>(null);
  const [frase, setFrase] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleEmocion = (key: string) => {
    setSeleccion((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const limpiar = () => {
    setSeleccion([]);
    setOtroActivo(false);
    setOtroTexto('');
    setIntensidad(3);
    setPrivacidad('privado');
  };

  const enviar = (formData: FormData) => {
    // Emoción principal = la primera elegida; si solo hay "Otro", usamos 'otro'.
    const otroTxt = otroActivo ? otroTexto.trim() : '';
    const principal = seleccion[0] ?? (otroTxt ? 'otro' : '');
    if (!principal) {
      setError('Elige al menos una emoción.');
      return;
    }
    const secundarias = seleccion.slice(principal === 'otro' ? 0 : 1);
    if (otroTxt && principal !== 'otro') secundarias.push('otro');

    formData.set('emocion', principal);
    formData.set('emociones_secundarias', secundarias.join(','));
    formData.set('emocion_otro', otroTxt);
    formData.set('intensidad', String(intensidad));
    formData.set('privacidad', privacidad);
    setError(null);
    startTransition(async () => {
      const res = await crearRegistroAction(formData);
      if (res.ok) {
        setAbierto(false);
        limpiar();
        if (res.frase) setFrase(res.frase);
      } else {
        setError(res.error ?? 'Error');
      }
    });
  };

  if (!abierto) {
    return (
      <div>
        <button
          onClick={() => {
            setFrase(null);
            setAbierto(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-noema-deep px-5 py-4 text-base font-medium text-bone shadow-sm transition-colors hover:bg-noema-deep/90"
        >
          <Plus className="size-5" strokeWidth={2} />
          Registrar cómo me siento
        </button>

        {/* Frase motivacional acorde a lo que acaba de registrar */}
        {frase && (
          <div className="mt-3 rounded-2xl border border-noema-sage/30 bg-gradient-to-br from-noema-sage/[0.1] to-transparent p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-noema-sage">Para ti</p>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-ink/85">{frase}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={enviar} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6">
      <h3 className="font-serif text-lg text-ink">¿Cómo te sientes?</h3>

      <div>
        <label className="mb-2 block text-sm text-ink/70">
          Emoción <span className="text-ink/45">— puedes elegir varias</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {emociones.map((e) => {
            const Icono = iconoDeEmocion(e.key, e.familia);
            const activa = seleccion.includes(e.key);
            return (
              <button
                key={e.key}
                type="button"
                onClick={() => toggleEmocion(e.key)}
                aria-pressed={activa}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  activa
                    ? 'border-noema-deep bg-noema-deep text-bone'
                    : 'border-ink/15 text-ink/70 hover:border-noema-sage'
                }`}
              >
                <Icono className="size-4" strokeWidth={1.7} />
                {e.nombre_es}
              </button>
            );
          })}

          {/* Opción "Otro" */}
          <button
            type="button"
            onClick={() => setOtroActivo((v) => !v)}
            aria-pressed={otroActivo}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              otroActivo
                ? 'border-noema-deep bg-noema-deep text-bone'
                : 'border-dashed border-ink/25 text-ink/70 hover:border-noema-sage'
            }`}
          >
            <Plus className="size-4" strokeWidth={1.9} />
            Otro
          </button>
        </div>

        {otroActivo && (
          <input
            value={otroTexto}
            onChange={(e) => setOtroTexto(e.target.value)}
            placeholder="¿Qué emoción sentías? Escríbela…"
            className="mt-2 w-full rounded-md border border-ink/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
          />
        )}
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
          disabled={pending || (seleccion.length === 0 && !(otroActivo && otroTexto.trim()))}
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
