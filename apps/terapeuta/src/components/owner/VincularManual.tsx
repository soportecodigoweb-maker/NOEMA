'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Check } from 'lucide-react';
import { crearVinculacionManualAction } from '../../../app/owner/vincular-actions';

export function VincularManual() {
  const router = useRouter();
  const [terapeuta, setTerapeuta] = useState('');
  const [paciente, setPaciente] = useState('');
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const vincular = () => {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const r = await crearVinculacionManualAction(terapeuta, paciente);
      if (r.ok) {
        setOk(true);
        setTerapeuta('');
        setPaciente('');
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo vincular.');
      }
    });
  };

  const input =
    'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
        <Link2 className="size-5 text-noema-sage" /> Vincular manualmente
      </h2>
      <p className="mb-3 text-sm text-foreground-muted">
        Crea una vinculación activa entre un terapeuta y un paciente por su correo.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-0.5 block text-xs text-foreground-muted">Correo del terapeuta</span>
          <input className={input} type="email" value={terapeuta} onChange={(e) => setTerapeuta(e.target.value)} placeholder="terapeuta@correo.com" />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-xs text-foreground-muted">Correo del paciente</span>
          <input className={input} type="email" value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="paciente@correo.com" />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={vincular}
          disabled={pending || !terapeuta.trim() || !paciente.trim()}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Vinculando…' : 'Crear vinculación'}
        </button>
        {ok && (
          <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
            <Check className="size-4" /> Vinculación creada
          </span>
        )}
      </div>
    </section>
  );
}
