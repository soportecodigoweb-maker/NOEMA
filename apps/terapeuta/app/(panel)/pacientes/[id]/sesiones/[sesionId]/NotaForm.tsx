'use client';

import { useState, useTransition } from 'react';
import { Lock, Eye, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { guardarNotaSesionAction } from './actions';

interface NotaInicial {
  id: string;
  contenido_publico: string | null;
  contenido_privado: string | null;
  plan_proxima_sesion: string | null;
  visible_paciente: boolean;
}

interface Props {
  sesionId: string;
  vinculacionId: string;
  initial: NotaInicial | null;
}

export function NotaForm({ sesionId, vinculacionId, initial }: Props) {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      await guardarNotaSesionAction(sesionId, vinculacionId, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <form action={onSubmit} className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-noema-sage" />
            <h3 className="font-semibold text-ink">Resumen para el paciente</h3>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
            <input
              type="checkbox"
              name="visible"
              defaultChecked={initial?.visible_paciente ?? true}
              className="size-4 accent-noema-sage"
            />
            Visible para paciente
          </label>
        </div>
        <Textarea
          name="publico"
          defaultValue={initial?.contenido_publico ?? ''}
          placeholder="Lo que quieres que el paciente recuerde de hoy. Frases clave, insights, próximos pasos…"
          className="min-h-[120px]"
        />
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="size-4 text-foreground-muted" />
          <h3 className="font-semibold text-ink">Notas privadas</h3>
          <span className="text-xs text-foreground-muted">— Solo tú</span>
        </div>
        <Textarea
          name="privado"
          defaultValue={initial?.contenido_privado ?? ''}
          placeholder="Observaciones clínicas, hipótesis, alertas. El paciente jamás verá esto."
          className="min-h-[160px]"
        />
      </Card>

      <Card>
        <h3 className="font-semibold text-ink mb-4">Plan para la próxima sesión</h3>
        <Textarea
          name="plan"
          defaultValue={initial?.plan_proxima_sesion ?? ''}
          placeholder="Qué quieres trabajar la próxima vez."
          className="min-h-[80px]"
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-noema-sage inline-flex items-center gap-1">
            <Check className="size-4" /> Guardado
          </span>
        )}
        <Button type="submit" variant="primary" size="md" loading={isPending}>
          Guardar notas
        </Button>
      </div>
    </form>
  );
}
