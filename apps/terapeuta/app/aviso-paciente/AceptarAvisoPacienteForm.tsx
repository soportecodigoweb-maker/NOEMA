'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { aceptarAvisoPacienteAction } from './actions';

export function AceptarAvisoPacienteForm() {
  const [aceptado, setAceptado] = useState(false);

  return (
    <form action={aceptarAvisoPacienteAction} className="mt-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
          className="mt-1 size-4 shrink-0 accent-noema-sage"
        />
        <span className="text-sm text-ink/80">
          Leí y entiendo que yo decido qué información comparto con mi terapeuta y
          qué queda privado.
        </span>
      </label>
      <SubmitButton disabled={!aceptado} />
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
