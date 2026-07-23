import { PageSkeleton } from '@/components/ui/Skeleton';

// Se muestra al instante al navegar entre secciones del panel,
// mientras llegan los datos del servidor.
export default function Loading() {
  return <PageSkeleton filas={5} />;
}
