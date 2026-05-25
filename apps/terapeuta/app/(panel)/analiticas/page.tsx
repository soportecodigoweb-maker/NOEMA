import { Card } from '@/components/ui/Card';

export const metadata = { title: 'Analíticas' };

export default function AnaliticasPage() {
  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <h1 className="font-serif text-4xl text-ink leading-tight mb-2">
        Analíticas
      </h1>
      <p className="text-foreground-muted mb-8">
        Patrones agregados de tu consulta. Esto es información operativa,
        no diagnóstica.
      </p>
      <Card variant="flat" className="text-center py-16">
        <p className="text-foreground-muted">
          Gráficas y reportes · próximamente.
        </p>
      </Card>
    </div>
  );
}
