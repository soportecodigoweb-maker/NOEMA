import Link from 'next/link';
import { Plus, Calendar, Video, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatFecha } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Sesion {
  id: string;
  numero: number | null;
  fecha_programada: string;
  fecha_realizada: string | null;
  duracion_min: number;
  modalidad: 'presencial' | 'online' | 'hibrida';
  link_videollamada: string | null;
  ubicacion: string | null;
  estado: 'programada' | 'realizada' | 'cancelada' | 'reagendada' | 'no_asistio';
}

export default async function SesionesPacientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sesiones } = await supabase
    .from('sesiones')
    .select('id, numero, fecha_programada, fecha_realizada, duracion_min, modalidad, link_videollamada, ubicacion, estado')
    .eq('vinculacion_id', id)
    .order('fecha_programada', { ascending: false });

  const ahora = Date.now();
  const proximas = (sesiones ?? []).filter(
    (s: Sesion) => new Date(s.fecha_programada).getTime() > ahora && s.estado === 'programada'
  );
  const pasadas = (sesiones ?? []).filter(
    (s: Sesion) => new Date(s.fecha_programada).getTime() <= ahora || s.estado !== 'programada'
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink mb-1">Sesiones</h2>
          <p className="text-sm text-foreground-muted">
            Historial y próximas sesiones con este paciente.
          </p>
        </div>
        <Link href={`/pacientes/${id}/sesiones/nueva`}>
          <Button variant="primary" size="md">
            <Plus className="size-4" />
            Programar sesión
          </Button>
        </Link>
      </div>

      {/* Próximas */}
      <div>
        <h3 className="caption mb-3">Próximas</h3>
        {proximas.length === 0 ? (
          <Card variant="flat" className="text-center py-8">
            <p className="text-sm text-foreground-muted">Sin sesiones programadas.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {proximas.map((s: Sesion) => (
              <SesionRow key={s.id} sesion={s} vinculacionId={id} />
            ))}
          </ul>
        )}
      </div>

      {/* Pasadas */}
      <div>
        <h3 className="caption mb-3">Historial</h3>
        {pasadas.length === 0 ? (
          <Card variant="flat" className="text-center py-8">
            <p className="text-sm text-foreground-muted">Aún no hay sesiones realizadas.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {pasadas.map((s: Sesion) => (
              <SesionRow key={s.id} sesion={s} vinculacionId={id} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SesionRow({ sesion, vinculacionId }: { sesion: Sesion; vinculacionId: string }) {
  const fecha = new Date(sesion.fecha_programada);
  return (
    <Link
      href={`/pacientes/${vinculacionId}/sesiones/${sesion.id}`}
      className="block"
    >
      <Card variant="flat" className="hover:bg-paper/30 transition-colors">
        <div className="flex items-center gap-4">
          <div className="text-center shrink-0 w-14">
            <p className="font-serif text-2xl text-ink leading-none">{fecha.getDate()}</p>
            <p className="caption mt-1">{fecha.toLocaleDateString('es-MX', { month: 'short' })}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {sesion.numero && (
                <span className="caption">Sesión #{sesion.numero}</span>
              )}
              <EstadoBadge estado={sesion.estado} />
            </div>
            <p className="font-medium text-ink">
              {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {sesion.duracion_min} min
            </p>
            <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1">
              {sesion.modalidad === 'online' && <Video className="size-3" />}
              {sesion.modalidad === 'presencial' && <MapPin className="size-3" />}
              {sesion.modalidad === 'hibrida' && <Calendar className="size-3" />}
              {sesion.modalidad === 'online' && sesion.link_videollamada ? 'Videollamada' : sesion.modalidad}
              {sesion.ubicacion && ` · ${sesion.ubicacion}`}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EstadoBadge({ estado }: { estado: Sesion['estado'] }) {
  const map: Record<Sesion['estado'], { label: string; color: string }> = {
    programada: { label: 'Programada', color: 'bg-noema-sage/15 text-noema-deep' },
    realizada: { label: 'Realizada', color: 'bg-emotion-tranquilo/40 text-ink/70' },
    cancelada: { label: 'Cancelada', color: 'bg-noema-deep/10 text-ink/50' },
    reagendada: { label: 'Reagendada', color: 'bg-emotion-ansioso/30 text-ink/70' },
    no_asistio: { label: 'No asistió', color: 'bg-[#B85450]/15 text-[#B85450]' },
  };
  return (
    <span className={`caption px-2 py-1 rounded ${map[estado].color}`}>
      {map[estado].label}
    </span>
  );
}
