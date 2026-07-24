'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Video, MapPin, Users2 } from 'lucide-react';

export interface SesionCal {
  id: string;
  vinculacionId: string;
  paciente: string;
  fecha: string; // ISO
  duracion: number;
  modalidad: string;
  estado: string;
}

const TZ = 'America/Mexico_City';
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** 'YYYY-MM-DD' en hora de CDMX (para agrupar por día correctamente). */
function claveDiaCDMX(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
}
function horaCDMX(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
}
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Calendario mensual tipo Google con todas las citas del terapeuta.
 * Agrupa por día en hora de CDMX; clic en una cita abre su detalle.
 */
export function CalendarioSesiones({ sesiones }: { sesiones: SesionCal[] }) {
  const router = useRouter();
  const hoyKey = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const [ancla, setAncla] = useState(() => {
    const [y, m] = hoyKey.split('-').map(Number);
    return { y: y!, m: (m! - 1) }; // m 0-indexed
  });
  const [diaSel, setDiaSel] = useState<string | null>(hoyKey);

  // Agrupar sesiones por día CDMX
  const porDia = useMemo(() => {
    const map = new Map<string, SesionCal[]>();
    for (const s of sesiones) {
      const k = claveDiaCDMX(s.fecha);
      const arr = map.get(k) ?? [];
      arr.push(s);
      map.set(k, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return map;
  }, [sesiones]);

  // Celdas del mes (6 semanas = 42 celdas)
  const celdas = useMemo(() => {
    const primero = new Date(ancla.y, ancla.m, 1);
    const inicio = new Date(ancla.y, ancla.m, 1 - primero.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return {
        key,
        dia: d.getDate(),
        mesActual: d.getMonth() === ancla.m,
        esHoy: key === hoyKey,
        sesiones: porDia.get(key) ?? [],
      };
    });
  }, [ancla, porDia, hoyKey]);

  const mover = (delta: number) => {
    const nueva = new Date(ancla.y, ancla.m + delta, 1);
    setAncla({ y: nueva.getFullYear(), m: nueva.getMonth() });
  };
  const irHoy = () => {
    const [y, m] = hoyKey.split('-').map(Number);
    setAncla({ y: y!, m: m! - 1 });
    setDiaSel(hoyKey);
  };

  const sesionesDelDia = diaSel ? porDia.get(diaSel) ?? [] : [];

  return (
    <div>
      {/* Cabecera del calendario */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl capitalize text-ink">
          {MESES[ancla.m]} {ancla.y}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={irHoy}
            className="mr-1 rounded-md border border-noema-deep/15 px-3 py-1.5 text-sm text-ink hover:border-noema-deep/30"
          >
            Hoy
          </button>
          <button onClick={() => mover(-1)} aria-label="Mes anterior" className="rounded-md p-1.5 hover:bg-bone">
            <ChevronLeft className="size-5 text-ink/70" />
          </button>
          <button onClick={() => mover(1)} aria-label="Mes siguiente" className="rounded-md p-1.5 hover:bg-bone">
            <ChevronRight className="size-5 text-ink/70" />
          </button>
        </div>
      </div>

      {/* Rejilla */}
      <div className="overflow-hidden rounded-2xl border border-noema-deep/10 bg-white">
        <div className="grid grid-cols-7 border-b border-noema-deep/[0.06] bg-bone/40">
          {DIAS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celdas.map((c) => (
            <button
              key={c.key}
              onClick={() => setDiaSel(c.key)}
              className={`min-h-[92px] border-b border-r border-noema-deep/[0.05] p-1.5 text-left align-top transition-colors last:border-r-0 hover:bg-bone/40 ${
                c.mesActual ? '' : 'bg-bone/20'
              } ${diaSel === c.key ? 'ring-1 ring-inset ring-noema-sage' : ''}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                    c.esHoy
                      ? 'bg-noema-deep font-semibold text-bone'
                      : c.mesActual
                        ? 'text-ink'
                        : 'text-foreground-muted/50'
                  }`}
                >
                  {c.dia}
                </span>
              </div>
              <div className="space-y-1">
                {c.sesiones.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${colorSesion(s)}`}
                    title={`${horaCDMX(s.fecha)} · ${s.paciente}`}
                  >
                    {horaCDMX(s.fecha)} {s.paciente}
                  </span>
                ))}
                {c.sesiones.length > 3 && (
                  <span className="block text-[10px] text-foreground-muted">
                    +{c.sesiones.length - 3} más
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {diaSel && (
        <div className="mt-5">
          <h3 className="caption mb-2 capitalize">
            {new Date(`${diaSel}T12:00:00`).toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h3>
          {sesionesDelDia.length === 0 ? (
            <p className="rounded-xl border border-dashed border-noema-deep/15 bg-white py-6 text-center text-sm text-foreground-muted">
              Sin sesiones este día.
            </p>
          ) : (
            <ul className="space-y-2">
              {sesionesDelDia.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => router.push(`/pacientes/${s.vinculacionId}/sesiones/${s.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-noema-deep/10 bg-white px-4 py-3 text-left transition-colors hover:border-noema-sage"
                  >
                    <div className="w-16 shrink-0 text-sm font-medium text-ink">{horaCDMX(s.fecha)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{s.paciente}</p>
                      <p className="flex items-center gap-1 text-xs capitalize text-foreground-muted">
                        <IconoModalidad m={s.modalidad} /> {s.modalidad} · {s.duracion} min
                      </p>
                    </div>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${estadoColor(s.estado)}`}>
                      {estadoLabel(s.estado)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function colorSesion(s: SesionCal): string {
  if (s.estado === 'cancelada' || s.estado === 'no_asistio') return 'bg-ink/8 text-ink/50 line-through';
  if (s.estado === 'realizada') return 'bg-emerald-500/12 text-emerald-800';
  if (s.modalidad === 'online') return 'bg-noema-sage/15 text-noema-deep';
  return 'bg-emotion-tranquilo/40 text-noema-deep';
}
function estadoColor(estado: string): string {
  const map: Record<string, string> = {
    programada: 'bg-noema-sage/15 text-noema-deep',
    realizada: 'bg-emerald-500/15 text-emerald-700',
    cancelada: 'bg-ink/10 text-ink/50',
    no_asistio: 'bg-amber-400/20 text-amber-700',
    reagendada: 'bg-emotion-ansioso/30 text-ink/70',
  };
  return map[estado] ?? 'bg-ink/10 text-ink/60';
}
function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    programada: 'Programada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
    no_asistio: 'No asistió',
    reagendada: 'Reagendada',
  };
  return map[estado] ?? estado;
}
function IconoModalidad({ m }: { m: string }) {
  if (m === 'online') return <Video className="size-3" />;
  if (m === 'presencial') return <MapPin className="size-3" />;
  return <Users2 className="size-3" />;
}
