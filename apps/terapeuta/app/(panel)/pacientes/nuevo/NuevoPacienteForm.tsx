'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { crearVinculacionAction } from './actions';

/** Mensaje listo para copiar y enviarle al paciente por WhatsApp o correo. */
function MensajeParaPaciente({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const texto = `Hola, te comparto tu acceso a NOEMA para dar seguimiento a tu proceso entre sesiones:

1) Entra a https://app.somosnoema.com y crea tu cuenta.
2) Elige "Soy paciente" y completa tus datos.
3) En tu inicio, toca "Colocar código para vincularme" y escribe este código:

${codigo}

Cualquier duda, avísame.`;

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Card variant="flat">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">Mensaje listo para enviar</h3>
        <button
          onClick={copiar}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-noema-sage hover:text-noema-deep"
        >
          {copiado ? (
            <>
              <Check className="size-4" strokeWidth={2} /> Copiado
            </>
          ) : (
            <>
              <Copy className="size-4" strokeWidth={1.8} /> Copiar mensaje
            </>
          )}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg bg-paper/60 p-3 text-xs leading-relaxed text-ink/75">
        {texto}
      </pre>
    </Card>
  );
}

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
          <ol className="mb-3 space-y-2 text-sm text-foreground-muted leading-relaxed">
            <li>
              <span className="font-medium text-ink">1.</span> Tu paciente entra a{' '}
              <span className="font-medium text-ink">app.somosnoema.com</span> y{' '}
              <span className="font-medium text-ink">crea su cuenta</span> (es indispensable: sin
              cuenta no puede usar el código).
            </li>
            <li>
              <span className="font-medium text-ink">2.</span> En el onboarding elige{' '}
              <em>"Soy paciente"</em> y completa sus datos.
            </li>
            <li>
              <span className="font-medium text-ink">3.</span> En su inicio, toca{' '}
              <em>"Colocar código para vincularme"</em> y pega este código.
            </li>
          </ol>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Al aceptar el aviso de privacidad, la vinculación queda activa y empezarás a recibir su
            actividad. El código sirve una sola vez.
          </p>
        </Card>

        {/* Mensaje listo para copiar y enviar por WhatsApp/correo */}
        <MensajeParaPaciente codigo={codigo} />

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
