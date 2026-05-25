import { Card } from '@/components/ui/Card';

export const metadata = { title: 'Mensajes' };

export default function MensajesPage() {
  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Mensajes</h1>
      <p className="text-foreground-muted mb-8">
        Comunicación asíncrona con tus pacientes. No es chat 24/7.
      </p>
      <Card variant="flat" className="text-center py-16">
        <p className="text-foreground-muted">
          Cuando tengas conversaciones, aparecerán aquí.
        </p>
      </Card>
    </div>
  );
}
