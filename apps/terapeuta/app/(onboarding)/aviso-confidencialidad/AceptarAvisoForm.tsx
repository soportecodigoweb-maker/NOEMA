'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { aceptarAvisoAction } from './actions';

export function AceptarAvisoForm() {
  const [aceptado, setAceptado] = useState(false);

  return (
    <form action={aceptarAvisoAction} className="mt-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
          className="mt-1 size-4 shrink-0 accent-noema-sage"
        />
        <span className="text-sm text-ink/80">
          He leído y acepto el Aviso de Confidencialidad y Responsabilidad
          Profesional. Me comprometo a resguardar la información de mis pacientes
          conforme a la LFPDPPP y la NOM-004-SSA3-2012.
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
      {pending ? 'Guardando…' : 'Aceptar y continuar'}
    </button>
  );
}
