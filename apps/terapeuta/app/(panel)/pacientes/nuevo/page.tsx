import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { NuevoPacienteForm } from './NuevoPacienteForm';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Nuevo paciente' };

export default function NuevoPacientePage() {
  return (
    <div className="px-8 py-10 max-w-2xl mx-auto">
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1 text-foreground-muted hover:text-ink mb-6 text-sm"
      >
        <ChevronLeft className="size-4" strokeWidth={1.6} />
        Pacientes
      </Link>

      <div className="space-y-3 mb-8">
        <h1 className="font-serif text-4xl text-ink leading-tight">
          Vincular un paciente
        </h1>
        <p className="text-foreground-muted">
          Generaremos un código único que tu paciente introducirá en la app
          móvil. Cuando lo haga y acepte el consentimiento informado, la
          vinculación queda activa.
        </p>
      </div>

      <NuevoPacienteForm />
    </div>
  );
}
