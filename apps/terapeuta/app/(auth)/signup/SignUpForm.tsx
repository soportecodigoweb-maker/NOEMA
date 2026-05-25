'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signUpAction } from '../actions';

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result && !result.ok) {
        setError(result.error ?? 'No pudimos crear tu cuenta.');
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <Input
        name="nombre"
        label="¿Cómo te llamas?"
        placeholder="Dra. Andrea Ruiz"
        autoComplete="name"
        required
      />
      <Input
        type="email"
        name="email"
        label="Correo profesional"
        placeholder="andrea@consultorio.com"
        autoComplete="email"
        required
      />
      <Input
        type="password"
        name="password"
        label="Contraseña"
        autoComplete="new-password"
        minLength={8}
        required
        helper="Mínimo 8 caracteres."
        error={error ?? undefined}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isPending}
      >
        Crear cuenta
      </Button>
    </form>
  );
}
