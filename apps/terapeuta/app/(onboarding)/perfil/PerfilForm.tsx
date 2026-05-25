'use client';

import { useState, useTransition } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { completarPerfilAction } from './actions';

const modalidadOptions: Array<{ value: string; label: string }> = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrida', label: 'Híbrida' },
];

export function PerfilForm() {
  const [error, setError] = useState<string | null>(null);
  const [modalidades, setModalidades] = useState<string[]>(['online']);
  const [isPending, startTransition] = useTransition();

  const toggleModalidad = (v: string) => {
    setModalidades((curr) =>
      curr.includes(v) ? curr.filter((m) => m !== v) : [...curr, v],
    );
  };

  const onSubmit = (formData: FormData) => {
    setError(null);
    // FormData ya incluye todos los inputs name=… pero modalidades es state, lo agregamos:
    formData.delete('modalidades');
    modalidades.forEach((m) => formData.append('modalidades', m));
    startTransition(async () => {
      const result = await completarPerfilAction(formData);
      if (result && !result.ok) setError(result.error ?? 'Algo no funcionó.');
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <Input
        name="titulo"
        label="Título profesional"
        placeholder="Lic. en Psicología · Mtra. en Psicoterapia"
        required
      />
      <Input
        name="cedula"
        label="Cédula profesional (opcional)"
        helper="Se valida después para tu verificación."
      />
      <Textarea
        name="descripcion"
        label="Sobre ti"
        placeholder="Trabajo con adultos en procesos de ansiedad, autoestima y vínculos. Mi enfoque…"
        required
        helper="Mínimo 2 párrafos. Esta es la primera impresión para tus pacientes."
      />
      <Input
        name="especialidades"
        label="Especialidades"
        placeholder="Ansiedad, autoestima, parejas, duelo"
        helper="Sepáralas por coma."
      />
      <Input
        name="enfoques"
        label="Enfoques terapéuticos"
        placeholder="Cognitivo-conductual, gestalt, sistémico"
        helper="Sepáralos por coma."
      />
      <Input
        name="ciudad"
        label="Ciudad"
        placeholder="Ciudad de México"
      />

      <div className="space-y-2">
        <label className="caption">Modalidades de atención</label>
        <div className="flex gap-2 flex-wrap">
          {modalidadOptions.map((opt) => {
            const selected = modalidades.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleModalidad(opt.value)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  selected
                    ? 'bg-noema-sage text-bone border-noema-sage'
                    : 'bg-bone text-foreground-muted border-noema-deep/10 hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-[#B85450]">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary" size="lg" loading={isPending}>
          Continuar al panel
        </Button>
      </div>
    </form>
  );
}
