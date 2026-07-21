import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, Video, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Sesion {
  id: string;
  fecha_programada: string;
  fecha_realizada: string | null;
  duracion_min: number | null;
  modalidad: string | null;
  link_videollamada: string | null;
  ubicacion: string | null;
  estado: string;
  notas: { contenido_publico: string | null; visible_paciente: boolean }[] | null;
}

export default async function PacienteSesionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  const { data: vinculacion } = await supabase
    .from('vinculaciones')
    .select('id')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  if (!vinculacion) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="font-serif text-3xl text-ink">Sesiones</h1>
        <p className="mt-4 text-ink/60">
          Aún no tienes un terapeuta vinculado.
        </p>
      </div>
    );
  }

  const { data: sesiones } = await supabase
    .from('sesiones')
    .select(`
      id, fecha_programada, fecha_realizada, duracion_min,
      modalidad, link_videollamada, ubicacion, estado,
      notas:sesion_notas(contenido_publico, visible_paciente)
    `)
    .eq('vinculacion_id', vinculacion.id)
    .order('fecha_programada', { ascending: false });

  const ahora = new Date();
  const proximas = (sesiones ?? []).filter(
    (s) => s.estado === 'programada' && new Date(s.fecha_programada) >= ahora,
  );
  const historial = (sesiones ?? []).filter(
    (s) => !proximas.some((p) => p.id === s.id),
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Sesiones</h1>

      <section className="mt-8">
        <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
          Próximas
        </h2>
        {proximas.length === 0 ? (
          <p className="rounded-2xl border-[0.5px] border-dashed border-ink/15 bg-white p-6 text-sm text-ink/50">
            Sin sesiones agendadas por ahora.
          </p>
        ) : (
          <div className="space-y-3">
            {proximas.map((s) => (
              <SesionCard key={s.id} sesion={s} destacar />
            ))}
          </div>
        )}
      </section>

      {historial.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
            Historial
          </h2>
          <div className="space-y-3">
            {historial.map((s) => (
              <SesionCard key={s.id} sesion={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SesionCard({ sesion, destacar }: { sesion: Sesion; destacar?: boolean }) {
  const fecha = new Date(sesion.fecha_programada);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  const notaPublica = sesion.notas?.find((n) => n.visible_paciente)?.contenido_publico;

  return (
    <article
      className={`rounded-2xl p-6 ${
        destacar && esHoy
          ? 'bg-noema-deep text-bone'
          : 'border-[0.5px] border-ink/10 bg-white'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
            destacar && esHoy ? 'bg-bone/15' : 'bg-noema-sage/10'
          }`}
        >
          <Calendar
            className={`size-5 ${destacar && esHoy ? 'text-bone' : 'text-noema-sage'}`}
            strokeWidth={1.6}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`font-serif text-lg ${destacar && esHoy ? 'text-bone' : 'text-ink'}`}
          >
            {fecha.toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h3>
          <p
            className={`mt-1 text-sm ${destacar && esHoy ? 'text-bone/80' : 'text-ink/60'}`}
          >
            {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}
            {sesion.duracion_min && ` · ${sesion.duracion_min} min`}
          </p>

          {sesion.modalidad === 'online' && sesion.link_videollamada && sesion.estado === 'programada' && (
            <a
              href={sesion.link_videollamada}
              target="_blank"
              rel="noreferrer"
              className={`mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${
                destacar && esHoy
                  ? 'bg-bone text-noema-deep'
                  : 'bg-noema-deep text-bone'
              }`}
            >
              <Video className="size-3.5" strokeWidth={1.8} />
              Entrar a videollamada
            </a>
          )}

          {sesion.modalidad === 'presencial' && sesion.ubicacion && (
            <p
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                destacar && esHoy ? 'text-bone/70' : 'text-ink/60'
              }`}
            >
              <MapPin className="size-3.5" strokeWidth={1.6} />
              {sesion.ubicacion}
            </p>
          )}

          {notaPublica && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${
                destacar && esHoy ? 'bg-bone/10 text-bone/90' : 'bg-paper text-ink/70'
              }`}
            >
              <p className={`mb-1 text-[11px] uppercase tracking-wider ${destacar && esHoy ? 'text-bone/60' : 'text-ink/50'}`}>
                Nota de tu terapeuta
              </p>
              {notaPublica}
            </div>
          )}
        </div>
        {sesion.estado !== 'programada' && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              sesion.estado === 'realizada'
                ? 'bg-noema-sage/15 text-noema-sage'
                : 'bg-ink/10 text-ink/60'
            }`}
          >
            {sesion.estado === 'realizada'
              ? 'Realizada'
              : sesion.estado === 'cancelada'
                ? 'Cancelada'
                : sesion.estado === 'no_asistio'
                  ? 'No asistió'
                  : sesion.estado}
          </span>
        )}
      </div>
    </article>
  );
}
