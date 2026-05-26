import Link from 'next/link';
import { Calendar, Video, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const metadata = { title: 'Sesiones' };
export const dynamic = 'force-dynamic';

interface SesionRow {
  id: string;
  numero: number | null;
  fecha_programada: string;
  duracion_min: number;
  modalidad: string;
  estado: string;
  vinculacion: {
    id: string;
    paciente: { nombre: string } | null;
  } | null;
}

export default async function SesionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Sesiones de TODAS las vinculaciones del terapeuta
  const { data: vincs } = await supabase
    .from('vinculaciones')
    .select('id')
    .eq('terapeuta_id', user.id);

  const vincIds = (vincs ?? []).map((v: { id: string }) => v.id);
  if (vincIds.length === 0) {
    return (
      <div className="px-8 py-10 max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl text-ink mb-2">Sesiones</h1>
        <p className="text-foreground-muted mb-8">
          Aquí verás todas tus sesiones programadas y realizadas.
        </p>
        <Card variant="flat" className="text-center py-16">
          <p className="text-foreground-muted">
            Cuando vincules pacientes y programes sesiones, aparecerán aquí.
          </p>
        </Card>
      </div>
    );
  }

  const { data: sesiones } = await supabase
    .from('sesiones')
    .select(`
      id, numero, fecha_programada, duracion_min, modalidad, estado,
      vinculacion:vinculaciones!sesiones_vinculacion_id_fkey(
        id,
        paciente:profiles!vinculaciones_paciente_id_fkey(nombre)
      )
    `)
    .in('vinculacion_id', vincIds)
    .order('fecha_programada', { ascending: true });

  const ahora = Date.now();
  const lista = (sesiones as SesionRow[] | null) ?? [];
  const proximas = lista.filter(
    (s) => new Date(s.fecha_programada).getTime() > ahora && s.estado === 'programada',
  );
  const recientes = lista
    .filter(
      (s) =>
        new Date(s.fecha_programada).getTime() <= ahora || s.estado !== 'programada',
    )
    .reverse();

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Sesiones</h1>
        <p className="text-foreground-muted">
          Tu agenda completa, organizada por fecha.
        </p>
      </div>

      <section>
        <h2 className="caption mb-3">Próximas ({proximas.length})</h2>
        {proximas.length === 0 ? (
          <Card variant="flat" className="text-center py-8">
            <p className="text-sm text-foreground-muted">Sin sesiones programadas.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {proximas.map((s) => (
              <SesionItem key={s.id} sesion={s} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="caption mb-3">Recientes ({recientes.length})</h2>
        {recientes.length === 0 ? (
          <Card variant="flat" className="text-center py-8">
            <p className="text-sm text-foreground-muted">Sin sesiones realizadas todavía.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {recientes.slice(0, 30).map((s) => (
              <SesionItem key={s.id} sesion={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SesionItem({ sesion }: { sesion: SesionRow }) {
  const f = new Date(sesion.fecha_programada);
  if (!sesion.vinculacion) return null;
  return (
    <Link
      href={`/pacientes/${sesion.vinculacion.id}/sesiones/${sesion.id}`}
      className="block"
    >
      <Card variant="flat" className="hover:bg-paper/30 transition-colors">
        <div className="flex items-center gap-4">
          <div className="text-center shrink-0 w-14">
            <p className="font-serif text-2xl text-ink leading-none">{f.getDate()}</p>
            <p className="caption mt-1">{f.toLocaleDateString('es-MX', { month: 'short' })}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ink truncate">
              {sesion.vinculacion.paciente?.nombre ?? 'Paciente'}
            </p>
            <p className="text-xs text-foreground-muted flex items-center gap-1">
              {f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {sesion.duracion_min} min
              {' · '}
              {sesion.modalidad === 'online' ? <Video className="size-3" /> :
                sesion.modalidad === 'presencial' ? <MapPin className="size-3" /> :
                <Calendar className="size-3" />}
              {sesion.modalidad}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
