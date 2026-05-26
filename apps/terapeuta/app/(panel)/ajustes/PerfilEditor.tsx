'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { actualizarPerfilAction } from './actions';

interface Props {
  profile: { nombre: string; email: string; ciudad: string };
  terapeuta: {
    titulo: string;
    descripcion: string;
    cedula: string;
    especialidades: string;
    enfoques: string;
  };
}

export function PerfilEditor({ profile, terapeuta }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await actualizarPerfilAction(formData);
      if (!r.ok) setError(r.error ?? 'Algo no funcionó.');
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <Input name="nombre" label="Nombre" defaultValue={profile.nombre} required />
      <Input label="Correo" value={profile.email} disabled />
      <Input
        name="titulo"
        label="Título profesional"
        defaultValue={terapeuta.titulo}
        required
      />
      <Input
        name="cedula"
        label="Cédula profesional"
        defaultValue={terapeuta.cedula}
      />
      <Textarea
        name="descripcion"
        label="Sobre ti"
        defaultValue={terapeuta.descripcion}
        className="min-h-[120px]"
      />
      <Input
        name="especialidades"
        label="Especialidades"
        defaultValue={terapeuta.especialidades}
        helper="Sepáralas por coma."
      />
      <Input
        name="enfoques"
        label="Enfoques"
        defaultValue={terapeuta.enfoques}
        helper="Sepáralos por coma."
      />
      <Input name="ciudad" label="Ciudad" defaultValue={profile.ciudad} />

      {error && <p className="text-sm text-[#B85450]">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        {saved && (
          <span className="text-sm text-noema-sage inline-flex items-center gap-1 self-center">
            <Check className="size-4" /> Guardado
          </span>
        )}
        <Button type="submit" variant="primary" size="md" loading={isPending}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
