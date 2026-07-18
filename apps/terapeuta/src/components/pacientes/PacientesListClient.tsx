'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { tiempoRelativo } from '@/lib/utils';
import { RIESGO, NIVELES_RIESGO, riesgoConfig, type NivelRiesgo } from '@/lib/riesgo';

export interface VinculacionRow {
  id: string;
  estado: string;
  fecha_inicio: string | null;
  actualizado_at: string;
  codigo_invitacion: string;
  nivel_riesgo: string;
  sos_habilitado: boolean;
  paciente: { id: string; nombre: string; avatar_url: string | null } | null;
}

const ESTADOS = [
  { key: 'activa', label: 'Activos' },
  { key: 'pausada', label: 'Pausados' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'finalizada', label: 'Finalizados' },
  { key: 'todos', label: 'Todos' },
] as const;

export function PacientesListClient({ rows }: { rows: VinculacionRow[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<string>('activa');
  const [riesgo, setRiesgo] = useState<NivelRiesgo | 'todos'>('todos');

  const conteosEstado = useMemo(() => {
    return rows.reduce<Record<string, number>>((acc, v) => {
      acc[v.estado] = (acc[v.estado] ?? 0) + 1;
      return acc;
    }, {});
  }, [rows]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return rows
      .filter((v) => (estado === 'todos' ? true : v.estado === estado))
      .filter((v) => (riesgo === 'todos' ? true : v.nivel_riesgo === riesgo))
      .filter((v) => {
        if (!q) return true;
        const nombre = v.paciente?.nombre?.toLowerCase() ?? '';
        const codigo = v.codigo_invitacion?.toLowerCase() ?? '';
        return nombre.includes(q) || codigo.includes(q);
      })
      .sort((a, b) => {
        // Primero por gravedad de riesgo desc, luego por actividad reciente
        const ra = riesgoConfig(a.nivel_riesgo).orden;
        const rb = riesgoConfig(b.nivel_riesgo).orden;
        if (ra !== rb) return rb - ra;
        return b.actualizado_at.localeCompare(a.actualizado_at);
      });
  }, [rows, busqueda, estado, riesgo]);

  return (
    <>
      {/* Filtros de estado + búsqueda */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ESTADOS.map((e) => {
          const count = e.key === 'todos' ? rows.length : conteosEstado[e.key] ?? 0;
          return (
            <button
              key={e.key}
              onClick={() => setEstado(e.key)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                estado === e.key
                  ? 'bg-noema-deep text-bone'
                  : 'border border-noema-deep/10 bg-bone text-foreground-muted hover:text-ink'
              }`}
            >
              {e.label} ({count})
            </button>
          );
        })}
        <div className="flex-1" />
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código"
            aria-label="Buscar paciente"
            className="h-10 rounded-md border border-noema-deep/10 bg-bone pl-9 pr-3 text-sm focus:border-noema-sage focus:outline-none focus:ring-1 focus:ring-noema-sage"
          />
        </div>
      </div>

      {/* Filtro de riesgo */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">Riesgo:</span>
        <button
          onClick={() => setRiesgo('todos')}
          className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
            riesgo === 'todos'
              ? 'bg-noema-deep text-bone'
              : 'border border-noema-deep/10 text-foreground-muted hover:text-ink'
          }`}
        >
          Todos
        </button>
        {NIVELES_RIESGO.slice()
          .reverse()
          .map((nivel) => {
            const cfg = RIESGO[nivel];
            const count = rows.filter((v) => v.nivel_riesgo === nivel).length;
            return (
              <button
                key={nivel}
                onClick={() => setRiesgo(nivel)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                  riesgo === nivel
                    ? 'bg-noema-deep text-bone'
                    : 'border border-noema-deep/10 text-foreground-muted hover:text-ink'
                }`}
              >
                <span className={`size-2 rounded-full ${cfg.dot}`} />
                {cfg.label} ({count})
              </button>
            );
          })}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <Card className="py-16 text-center">
          <p className="text-foreground-muted">
            {busqueda
              ? `Sin resultados para "${busqueda}".`
              : 'No hay pacientes en este filtro.'}
          </p>
        </Card>
      ) : (
        <Card variant="flat" className="overflow-hidden p-0">
          <ul className="divide-y divide-noema-deep/[0.06]">
            {filtradas.map((v) => {
              const cfg = riesgoConfig(v.nivel_riesgo);
              return (
                <li key={v.id}>
                  <Link
                    href={`/pacientes/${v.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper/40"
                  >
                    {/* Indicador de riesgo */}
                    <span
                      className={`h-9 w-1 shrink-0 rounded-full ${cfg.dot}`}
                      title={`Riesgo: ${cfg.label}`}
                    />
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15 text-sm font-medium text-noema-deep/70">
                      {v.paciente ? initials(v.paciente.nombre) : '⌛'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-ink">
                          {v.paciente?.nombre ?? `Invitación · ${v.codigo_invitacion}`}
                        </p>
                        {v.nivel_riesgo !== 'sin_evaluar' && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.badgeBg} ${cfg.badgeText}`}
                          >
                            {cfg.label}
                          </span>
                        )}
                        {!v.sos_habilitado && (
                          <span className="rounded bg-noema-deep/8 px-1.5 py-0.5 text-[10px] text-foreground-muted">
                            SOS off
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {v.fecha_inicio
                          ? `Desde ${new Date(v.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : 'Esperando código del paciente'}
                      </p>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      {tiempoRelativo(v.actualizado_at)}
                    </p>
                    <EstadoBadge estado={v.estado} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string }> = {
    activa: { label: 'Activo', color: 'bg-emotion-tranquilo/40 text-ink/70' },
    pausada: { label: 'Pausado', color: 'bg-emotion-ansioso/30 text-ink/70' },
    finalizada: { label: 'Finalizado', color: 'bg-noema-deep/10 text-ink/60' },
    pendiente: { label: 'Pendiente', color: 'bg-emotion-cansado/30 text-ink/70' },
    archivada: { label: 'Archivado', color: 'bg-noema-deep/10 text-ink/50' },
  };
  const v = map[estado] ?? { label: estado, color: 'bg-noema-deep/10 text-ink/60' };
  return <span className={`caption rounded px-2 py-1 ${v.color}`}>{v.label}</span>;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}
