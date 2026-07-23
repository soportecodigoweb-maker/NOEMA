import { Skeleton } from '@/components/ui/Skeleton';

// Contenido de la pestaña del paciente mientras carga (la cabecera y los
// tabs vienen del layout y se quedan fijos).
export default function Loading() {
  return (
    <div className="max-w-4xl space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}
