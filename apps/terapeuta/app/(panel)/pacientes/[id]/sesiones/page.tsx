import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export default function SesionesPacientePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink mb-1">Sesiones</h2>
          <p className="text-sm text-foreground-muted">
            Historial y próximas sesiones con este paciente.
          </p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="size-4" />
          Programar sesión
        </Button>
      </div>
      <Card variant="flat" className="text-center py-12">
        <p className="text-foreground-muted">
          Cuando programes la primera sesión, aparecerá aquí.
        </p>
      </Card>
    </div>
  );
}
