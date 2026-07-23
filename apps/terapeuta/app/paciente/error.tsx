'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function PacienteError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState reset={reset} />;
}
