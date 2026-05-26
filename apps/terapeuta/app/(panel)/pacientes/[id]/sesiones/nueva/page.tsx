import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProgramarSesionForm } from './ProgramarSesionForm';

export const metadata = { title: 'Programar sesión' };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NuevaSesionPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="px-8 py-10 max-w-2xl">
      <Link
        href={`/pacientes/${id}/sesiones`}
        className="inline-flex items-center gap-1 text-foreground-muted hover:text-ink mb-6 text-sm"
      >
        <ChevronLeft className="size-4" strokeWidth={1.6} />
        Sesiones
      </Link>

      <div className="space-y-3 mb-8">
        <h1 className="font-serif text-4xl text-ink leading-tight">
          Programar sesión
        </h1>
        <p className="text-foreground-muted">
          El paciente verá esta sesión en su app y recibirá un recordatorio.
        </p>
      </div>

      <ProgramarSesionForm vinculacionId={id} />
    </div>
  );
}
