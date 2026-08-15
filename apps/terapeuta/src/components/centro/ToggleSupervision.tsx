'use client';

import { useState, useTransition } from 'react';
import { Eye } from 'lucide-react';
import { activarSupervisionAction } from '../../../app/centro/supervision-actions';

export function ToggleSupervision({ inicial }: { inicial: boolean }) {
  const [activo, setActivo] = useState(inicial);
  const [pending, startTransition] = useTransition();

  const cambiar = () => {
    const nuevo = !activo;
    setActivo(nuevo);
    startTransition(async () => {
      const r = await activarSupervisionAction(nuevo);
      if (!r.ok) setActivo(!nuevo);
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
          <Eye className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">¿Este centro realiza supervisión clínica?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
            {activo
              ? 'Activada. Tus terapeutas reciben una solicitud para autorizar; una vez autorizan, puedes ver la información completa de sus pacientes para supervisar (cada acceso queda registrado y se les avisa).'
              : 'Desactivada. Solo ves el estado del tratamiento y datos generales. Si quieres ver el proceso completo de un paciente, deberás pedir autorización al terapeuta cada vez.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label="Supervisión clínica"
          disabled={pending}
          onClick={cambiar}
          className={`mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            activo ? 'bg-noema-sage' : 'bg-noema-deep/20'
          }`}
        >
          <span
            className={`block size-5 rounded-full bg-white shadow transition-transform ${
              activo ? '[transform:translateX(1.375rem)]' : '[transform:translateX(0.125rem)]'
            }`}
          />
        </button>
      </div>
    </section>
  );
}
