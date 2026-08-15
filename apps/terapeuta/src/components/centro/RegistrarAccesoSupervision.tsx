'use client';

import { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { registrarAccesoSupervisionAction } from '../../../app/centro/supervision-actions';

/** Registra el acceso a la info del paciente (una vez al abrir) y avisa al
 *  terapeuta con fecha y hora. */
export function RegistrarAccesoSupervision({ vinculacionId }: { vinculacionId: string }) {
  const hecho = useRef(false);
  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    registrarAccesoSupervisionAction(vinculacionId);
  }, [vinculacionId]);

  return (
    <p className="inline-flex items-center gap-1.5 rounded-lg bg-noema-sage/[0.08] px-3 py-1.5 text-xs text-noema-sage">
      <ShieldCheck className="size-3.5" /> Tu acceso quedó registrado y se avisó al terapeuta.
    </p>
  );
}
