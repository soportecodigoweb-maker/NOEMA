import { VincularManual } from '@/components/owner/VincularManual';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vincular · Panel de dueño' };

export default function OwnerVincularPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Vinculaciones</h1>
        <p className="text-sm text-foreground-muted">
          Crea vinculaciones manualmente cuando lo necesites.
        </p>
      </div>
      <VincularManual />
    </div>
  );
}
