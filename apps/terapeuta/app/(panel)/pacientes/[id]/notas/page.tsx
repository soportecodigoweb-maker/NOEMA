import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Lock } from 'lucide-react';

export default function NotasPacientePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink mb-1">Notas privadas</h2>
          <p className="text-sm text-foreground-muted flex items-center gap-1">
            <Lock className="size-3" /> Solo tú puedes verlas. El paciente jamás accede.
          </p>
        </div>
        <Button variant="primary" size="md">Nueva nota</Button>
      </div>
      <Card variant="flat" className="text-center py-12">
        <p className="text-foreground-muted">
          Aún no tienes notas para este paciente.
        </p>
      </Card>
    </div>
  );
}
