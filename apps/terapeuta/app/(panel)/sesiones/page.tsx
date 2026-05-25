import { Card } from '@/components/ui/Card';

export const metadata = { title: 'Sesiones' };

export default function SesionesPage() {
  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Sesiones</h1>
      <p className="text-foreground-muted mb-8">
        Todas tus sesiones programadas y realizadas, en una vista de calendario.
      </p>
      <Card variant="flat" className="text-center py-16">
        <p className="text-foreground-muted">
          Vista de agenda · próximamente.
        </p>
      </Card>
    </div>
  );
}
