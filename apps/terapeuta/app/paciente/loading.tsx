import { PageSkeleton } from '@/components/ui/Skeleton';

// Feedback instantáneo al navegar en la app del paciente.
export default function Loading() {
  return <PageSkeleton filas={4} />;
}
