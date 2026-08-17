'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowRightLeft, Check } from 'lucide-react';
import { reasignarTodosPacientesAction } from '../../../app/centro/supervision-actions';

/** Mueve TODOS los pacientes de un terapeuta a otro (cuando alguien se va). */
export function ReasignarTodos({
  origenId,
  totalPacientes,
  otrosTerapeutas,
}: {
  origenId: string;
  totalPacientes: number;
  otrosTerapeutas: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [destino, setDestino] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (totalPacientes === 0 || otrosTerapeutas.length === 0) return null;

  const mover = () => {
    setError(null);
    startTransition(async () => {
      const r = await reasignarTodosPacientesAction(origenId, destino);
      if (r.ok) {
        setResultado(`${r.movidos} paciente(s) reasignado(s).`);
        setConfirmar(false);
        setDestino('');
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo reasignar.');
      }
    });
  };

  const nombreDestino = otrosTerapeutas.find((o) => o.id === destino)?.nombre ?? '';

  return (
    <section className="rounded-2xl border border-noema-clay/25 bg-noema-clay/[0.04] p-5">
      <h2 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
        <ArrowRightLeft className="size-5 text-noema-clay" /> Reasignar todos sus pacientes
      </h2>
      <p className="mb-3 text-sm text-foreground-muted">
        Si este terapeuta deja el centro, mueve de una vez a sus{' '}
        <span className="font-medium text-ink">{totalPacientes} paciente(s)</span> con otro
        profesional para dar continuidad.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={destino}
          onChange={(e) => {
            setDestino(e.target.value);
            setConfirmar(false);
          }}
          className="flex-1 rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
        >
          <option value="">Elegir terapeuta destino…</option>
          {otrosTerapeutas.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>

        {!confirmar ? (
          <button
            onClick={() => setConfirmar(true)}
            disabled={!destino}
            className="inline-flex items-center gap-1.5 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            <Users className="size-4" /> Mover todos
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={mover}
              disabled={pending}
              className="rounded-md bg-noema-clay px-4 py-2 text-sm font-medium text-white hover:bg-noema-clay/90 disabled:opacity-50"
            >
              {pending ? 'Moviendo…' : `Sí, mover a ${nombreDestino}`}
            </button>
            <button onClick={() => setConfirmar(false)} className="px-3 py-2 text-sm text-foreground-muted hover:text-ink">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {resultado && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-noema-sage">
          <Check className="size-4" /> {resultado}
        </p>
      )}
    </section>
  );
}
