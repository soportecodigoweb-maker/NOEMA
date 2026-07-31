'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { aceptarAvisoPacienteAction } from './actions';
import { PUNTOS_CONSENTIMIENTO_PACIENTE } from '@/lib/aviso-privacidad-paciente';

export function AceptarAvisoPacienteForm() {
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const todas = PUNTOS_CONSENTIMIENTO_PACIENTE.every((p) => marcados[p.id]);

  const toggle = (id: string) =>
    setMarcados((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <form action={aceptarAvisoPacienteAction} className="mt-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-ink/50">
        Marca cada casilla para continuar
      </p>
      <div className="space-y-2.5">
        {PUNTOS_CONSENTIMIENTO_PACIENTE.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink/10 bg-white p-3 hover:border-noema-sage/40"
          >
            <input
              type="checkbox"
              checked={!!marcados[p.id]}
              onChange={() => toggle(p.id)}
              className="mt-0.5 size-4 shrink-0 accent-noema-sage"
            />
            <span className="text-sm leading-relaxed text-ink/80">{p.texto}</span>
          </label>
        ))}
      </div>
      <SubmitButton disabled={!todas} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-5 w-full rounded-md bg-noema-deep px-4 py-3 text-sm font-medium text-bone transition-opacity hover:bg-noema-deep/90 disabled:opacity-40"
    >
      {pending ? 'Guardando…' : 'Entiendo y acepto'}
    </button>
  );
}
