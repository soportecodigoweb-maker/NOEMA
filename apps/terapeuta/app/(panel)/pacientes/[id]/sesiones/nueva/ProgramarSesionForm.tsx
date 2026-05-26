'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { programarSesionAction } from './actions';

type Modalidad = 'online' | 'presencial' | 'hibrida';

export function ProgramarSesionForm({ vinculacionId }: { vinculacionId: string }) {
  const [modalidad, setModalidad] = useState<Modalidad>('online');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fecha de hoy (default)
  const hoy = new Date().toISOString().slice(0, 10);

  const onSubmit = (formData: FormData) => {
    setError(null);
    formData.set('modalidad', modalidad);
    startTransition(async () => {
      const result = await programarSesionAction(vinculacionId, formData);
      if (result && !result.ok) {
        setError(result.error ?? 'Algo no funcionó.');
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          name="fecha"
          label="Fecha"
          defaultValue={hoy}
          min={hoy}
          required
        />
        <Input
          type="time"
          name="hora"
          label="Hora"
          defaultValue="16:00"
          required
        />
      </div>

      <Input
        type="number"
        name="duracion"
        label="Duración (minutos)"
        defaultValue={60}
        min={15}
        max={240}
        step={5}
        required
      />

      <div className="space-y-2">
        <label className="caption">Modalidad</label>
        <div className="flex gap-2">
          {(['online', 'presencial', 'hibrida'] as Modalidad[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModalidad(m)}
              className={`px-4 py-2 rounded-full text-sm border transition-colors capitalize ${
                modalidad === m
                  ? 'bg-noema-sage text-bone border-noema-sage'
                  : 'bg-bone text-foreground-muted border-noema-deep/10 hover:text-ink'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {modalidad !== 'presencial' && (
        <Input
          type="url"
          name="link"
          label="Link de videollamada"
          placeholder="https://meet.google.com/..."
        />
      )}

      {modalidad !== 'online' && (
        <Input
          name="ubicacion"
          label="Ubicación"
          placeholder="Av. Reforma 123, CDMX"
        />
      )}

      {error && <p className="text-sm text-[#B85450]">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary" size="lg" loading={isPending}>
          Programar sesión
        </Button>
      </div>
    </form>
  );
}
