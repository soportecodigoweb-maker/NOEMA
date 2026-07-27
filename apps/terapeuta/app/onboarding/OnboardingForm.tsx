'use client';

import { useState, useTransition } from 'react';
import { Stethoscope, HeartHandshake, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { completarOnboardingAction } from './actions';

type Rol = 'terapeuta' | 'paciente';

export function OnboardingForm() {
  const [rol, setRol] = useState<Rol | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await completarOnboardingAction(formData);
      // Si tiene éxito, la acción redirige (no regresa). Si regresa, hubo error.
      if (r && !r.ok) setError(r.error ?? 'No pudimos guardar tus datos.');
    });
  };

  // --- Paso 1: elegir rol ---
  if (!rol) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-ink">Bienvenido a NOEMA</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Para empezar, cuéntanos cómo usarás la plataforma.
          </p>
        </div>

        <button
          onClick={() => setRol('terapeuta')}
          className="flex w-full items-start gap-3 rounded-xl border border-noema-deep/15 bg-white p-4 text-left transition-colors hover:border-noema-deep/40"
        >
          <Stethoscope className="mt-0.5 size-6 shrink-0 text-noema-deep" strokeWidth={1.6} />
          <span>
            <span className="block text-sm font-semibold text-ink">Soy terapeuta</span>
            <span className="block text-xs text-foreground-muted">
              Doy seguimiento a mis pacientes entre sesiones.
            </span>
          </span>
        </button>

        <button
          onClick={() => setRol('paciente')}
          className="flex w-full items-start gap-3 rounded-xl border border-noema-deep/15 bg-white p-4 text-left transition-colors hover:border-noema-deep/40"
        >
          <HeartHandshake className="mt-0.5 size-6 shrink-0 text-noema-clay" strokeWidth={1.6} />
          <span>
            <span className="block text-sm font-semibold text-ink">Soy paciente</span>
            <span className="block text-xs text-foreground-muted">
              Sigo mi proceso acompañado por mi terapeuta.
            </span>
          </span>
        </button>
      </div>
    );
  }

  // --- Paso 2: datos ---
  return (
    <form action={onSubmit} className="space-y-5">
      <button
        type="button"
        onClick={() => {
          setRol(null);
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.8} />
        Cambiar tipo de cuenta
      </button>

      <input type="hidden" name="rol" value={rol} />

      <div className="grid grid-cols-2 gap-3">
        <Input name="nombre" label="Nombre(s)" placeholder="Andrea" autoComplete="given-name" required />
        <Input name="apellidos" label="Apellidos" placeholder="Ruiz" autoComplete="family-name" required />
      </div>

      <Input
        type="tel"
        name="telefono"
        label="Teléfono"
        placeholder="55 1234 5678"
        autoComplete="tel"
        helper="Lo usamos para enlazar llamadas con tu terapeuta/paciente."
        required
      />

      {rol === 'terapeuta' && (
        <>
          <Input
            name="cedula_profesional"
            label="Cédula profesional"
            placeholder="12345678"
            required
          />
          <Input
            name="titulo"
            label="Título"
            placeholder="Psicóloga clínica"
            required
          />
          <Input
            name="especialidad"
            label="Especialidad principal"
            placeholder="Terapia cognitivo-conductual"
            required
          />
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-ink">Modalidad</legend>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="modalidades" value="online" className="size-4 accent-noema-deep" />
                En línea
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="modalidades" value="presencial" className="size-4 accent-noema-deep" />
                Presencial
              </label>
            </div>
          </fieldset>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" size="lg" fullWidth loading={pending}>
        {rol === 'terapeuta' ? 'Continuar al panel' : 'Empezar'}
      </Button>
    </form>
  );
}
