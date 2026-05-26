'use client';

import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { asignarPlantillaAction } from './actions';

interface Plantilla {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  duracion_min: number | null;
}

interface Props {
  vinculacionId: string;
  plantillas: Plantilla[];
}

export function AsignarEjercicioDialog({ vinculacionId, plantillas }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    if (!selectedId) {
      setError('Selecciona un ejercicio.');
      return;
    }
    formData.set('plantillaId', selectedId);
    startTransition(async () => {
      const r = await asignarPlantillaAction(vinculacionId, formData);
      if (!r.ok) {
        setError(r.error ?? 'Algo no funcionó.');
      } else {
        setOpen(false);
        setSelectedId(null);
      }
    });
  };

  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Asignar ejercicio
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-noema-deep/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-ink">Asignar ejercicio</h2>
          <button
            onClick={() => {
              setOpen(false);
              setSelectedId(null);
              setError(null);
            }}
            className="text-foreground-muted hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        <form action={onSubmit} className="space-y-5">
          {/* Selector de plantilla */}
          <div className="space-y-2">
            <label className="caption">Plantilla</label>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-noema-deep/10 rounded-md p-2">
              {plantillas.length === 0 ? (
                <p className="text-sm text-foreground-muted p-4 text-center">
                  No hay plantillas disponibles. Ve a la biblioteca para crear o usar
                  las oficiales NOEMA.
                </p>
              ) : (
                plantillas.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedId === p.id
                        ? 'bg-noema-sage/15 border border-noema-sage'
                        : 'hover:bg-paper border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-ink">{p.titulo}</p>
                      <span className="caption shrink-0">{p.categoria}</span>
                    </div>
                    {p.descripcion && (
                      <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                        {p.descripcion}
                      </p>
                    )}
                    {p.duracion_min && (
                      <p className="text-xs text-foreground-muted mt-1">
                        {p.duracion_min} min
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <Input
            type="date"
            name="fechaLimite"
            label="Fecha límite (opcional)"
            min={new Date().toISOString().slice(0, 10)}
          />

          <Textarea
            name="mensaje"
            label="Mensaje para el paciente (opcional)"
            placeholder="Una nota de contexto que aparecerá con la tarea."
          />

          {error && <p className="text-sm text-[#B85450]">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                setOpen(false);
                setSelectedId(null);
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isPending}>
              Asignar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
