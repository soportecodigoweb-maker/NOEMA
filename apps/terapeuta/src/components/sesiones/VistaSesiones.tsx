'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, List, Video, MapPin, Users2 } from 'lucide-react';
import { CalendarioSesiones, type SesionCal } from './CalendarioSesiones';

const TZ = 'America/Mexico_City';

/** Alterna entre vista calendario (tipo Google) y lista. */
export function VistaSesiones({ sesiones }: { sesiones: SesionCal[] }) {
  const [vista, setVista] = useState<'calendario' | 'lista'>('calendario');

  return (
    <div>
      <div className="mb-5 inline-flex rounded-lg border border-noema-deep/10 bg-white p-0.5">
        <Toggle activo={vista === 'calendario'} onClick={() => setVista('calendario')} icon={<Calendar className="size-4" />} label="Calendario" />
        <Toggle activo={vista === 'lista'} onClick={() => setVista('lista')} icon={<List className="size-4" />} label="Lista" />
      </div>

      {vista === 'calendario' ? (
        <CalendarioSesiones sesiones={sesiones} />
      ) : (
        <ListaSesiones sesiones={sesiones} />
      )}
    </div>
  );
}

function Toggle({ activo, onClick, icon, label }: { activo: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        activo ? 'bg-noema-deep text-bone' : 'text-ink/70 hover:text-ink'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ListaSesiones({ sesiones }: { sesiones: SesionCal[] }) {
  const ahora = Date.now();
  const proximas = sesiones
    .filter((s) => new Date(s.fecha).getTime() > ahora && s.estado === 'programada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const recientes = sesiones
    .filter((s) => new Date(s.fecha).getTime() <= ahora || s.estado !== 'programada')
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 30);

  return (
    <div className="space-y-8">
      <Seccion titulo={`Próximas (${proximas.length})`} sesiones={proximas} vacio="Sin sesiones programadas." />
      <Seccion titulo={`Recientes (${recientes.length})`} sesiones={recientes} vacio="Sin sesiones realizadas todavía." />
    </div>
  );
}

function Seccion({ titulo, sesiones, vacio }: { titulo: string; sesiones: SesionCal[]; vacio: string }) {
  return (
    <section>
      <h2 className="caption mb-3">{titulo}</h2>
      {sesiones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-noema-deep/15 bg-white py-8 text-center text-sm text-foreground-muted">
          {vacio}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {sesiones.map((s) => {
            const f = new Date(s.fecha);
            return (
              <li key={s.id}>
                <Link
                  href={`/pacientes/${s.vinculacionId}/sesiones/${s.id}`}
                  className="flex items-center gap-4 rounded-xl border border-noema-deep/10 bg-white px-4 py-3 transition-colors hover:border-noema-sage"
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className="font-serif text-xl leading-none text-ink">
                      {f.toLocaleDateString('es-MX', { day: 'numeric', timeZone: TZ })}
                    </p>
                    <p className="text-[10px] uppercase text-foreground-muted">
                      {f.toLocaleDateString('es-MX', { month: 'short', timeZone: TZ })}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{s.paciente}</p>
                    <p className="flex items-center gap-1 text-xs capitalize text-foreground-muted">
                      {f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: TZ })}
                      {' · '}
                      {s.modalidad === 'online' ? <Video className="size-3" /> : s.modalidad === 'presencial' ? <MapPin className="size-3" /> : <Users2 className="size-3" />}
                      {s.modalidad}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
