'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signInAction } from '../actions';

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signInAction(formData);
      if (result && !result.ok) {
        setError(result.error ?? 'No pudimos iniciar sesión.');
      }
    });
  };

  return (
    <form action={onSubmit} className="space-y-5">
      <Input
        type="email"
        name="email"
        label="Correo"
        placeholder="tu@correo.com"
        autoComplete="email"
        required
      />
      <Input
        type="password"
        name="password"
        label="Contraseña"
        autoComplete="current-password"
        required
        error={error ?? undefined}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isPending}
      >
        Iniciar sesión
      </Button>
    </form>
  );
}
