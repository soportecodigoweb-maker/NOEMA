'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { crearVinculacionAction } from './actions';

export function NuevoPacienteForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await crearVinculacionAction(formData);
      if (!result.ok) {
        setError(result.error ?? 'No pudimos crear la vinculación.');
      } else if (result.codigo) {
        setCodigo(result.codigo);
      }
    });
  };

  const copiar = async () => {
    if (!codigo) return;
    await navigator.clipboard.writeText(codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pantalla de éxito con el código
  if (codigo) {
    return (
      <div className="space-y-6">
        <Card variant="flat" className="text-center py-10">
          <p className="caption mb-3">Código de vinculación</p>
          <p className="font-serif text-5xl text-noema-deep tracking-wider mb-6">
            {codigo}
          </p>
          <button
            onClick={copiar}
            className="inline-flex items-center gap-2 text-sm text-noema-sage hover:text-noema-deep font-medium"
          >
            {copied ? (
              <>
                <Check className="size-4" strokeWidth={2} />
                Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" strokeWidth={1.8} />
                Copiar código
              </>
            )}
          </button>
        </Card>

        <Card variant="flat" className="bg-emotion-tranquilo/15 border-emotion-tranquilo/40">
          <h3 className="font-semibold text-ink mb-2">¿Cómo se lo comparto?</h3>
          <p className="text-sm text-foreground-muted mb-3 leading-relaxed">
            Pídele a tu paciente que descargue la app NOEMA en su celular,
            cree su cuenta como <em>"paciente con terapeuta"</em>, e introduzca
            este código en la pantalla de vinculación.
          </p>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Al aceptar el consentimiento informado, la vinculación queda activa
            y empezarás a recibir su actividad.
          </p>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setCodigo(null);
              setError(null);
            }}
          >
            Generar otro código
          </Button>
          <div className="flex-1" />
          <Link href="/pacientes">
            <Button variant="primary" size="md">
              Ver mis pacientes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Input
        name="nombre"
        label="Nombre del paciente"
        placeholder="María González"
        required
      />
      <Input
        type="email"
        name="email"
        label="Correo del paciente (opcional)"
        placeholder="maria@correo.com"
        helper="Si lo proporcionas, le pre-llenamos el email en la app."
        error={error ?? undefined}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="md" loading={isPending}>
          Generar código
        </Button>
      </div>
    </form>
  );
}
