import { Inbox } from 'lucide-react';
import { cargarSolicitudes } from '../data';
import { ListaSolicitudes } from '@/components/admin/ListaSolicitudes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Solicitudes · Panel de dueño' };

export default async function SolicitudesPage() {
  const solicitudes = await cargarSolicitudes();
  const abiertas = solicitudes.filter((s) => s.estado !== 'resuelta').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Inbox className="size-7 text-noema-sage" /> Solicitudes de usuarios
        </h1>
        <p className="text-sm text-foreground-muted">
          Soporte, dudas, sugerencias y observaciones que envían pacientes y terapeutas.
          {abiertas > 0 && ` ${abiertas} sin resolver.`}
        </p>
      </div>
      <ListaSolicitudes inicial={solicitudes} />
    </div>
  );
}
