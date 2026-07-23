import { cn } from '@/lib/utils';

/** Bloque gris con pulso, para estados de carga. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-noema-deep/[0.07]', className)}
      aria-hidden
    />
  );
}

/**
 * Esqueleto genérico de una página del panel: título + tarjetas.
 * Se muestra al instante al navegar (loading.tsx) mientras llegan los datos.
 */
export function PageSkeleton({
  titulo = true,
  filas = 4,
}: {
  titulo?: boolean;
  filas?: number;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      {titulo && (
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: filas }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
