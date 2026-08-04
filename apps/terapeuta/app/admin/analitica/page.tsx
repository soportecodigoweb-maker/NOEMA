import { Brain, Lock } from 'lucide-react';
import { analiticaClinica } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analítica clínica · Panel de dueño' };

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default async function AnaliticaPage() {
  const a = await analiticaClinica();
  const maxEmo = Math.max(1, ...a.topEmociones.map((e) => e.n));
  const maxHora = Math.max(1, ...a.porHora);
  const maxDia = Math.max(1, ...a.porDia);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Brain className="size-7 text-noema-sage" /> Analítica clínica
        </h1>
        <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <Lock className="size-3.5" /> Datos agregados y anónimos ({a.totalRegistros.toLocaleString('es-MX')} registros).
          Sin nombres ni contenido identificable.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Emociones más comunes */}
        <section className="rounded-2xl border border-noema-deep/10 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg text-ink">Emociones más registradas</h2>
          {a.topEmociones.length === 0 ? (
            <p className="text-sm text-foreground-muted">Aún no hay registros.</p>
          ) : (
            <ul className="space-y-3">
              {a.topEmociones.map((e) => (
                <li key={e.nombre}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-ink">{e.nombre}</span>
                    <span className="text-foreground-muted">{e.n}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-noema-deep/[0.06]">
                    <div className="h-full rounded-full bg-noema-clay" style={{ width: `${Math.round((e.n / maxEmo) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {a.intensidadPromedio != null && (
            <p className="mt-4 text-sm text-foreground-muted">
              Intensidad emocional promedio: <span className="font-medium text-ink">{a.intensidadPromedio}/5</span>
            </p>
          )}
        </section>

        {/* Por día de la semana */}
        <section className="rounded-2xl border border-noema-deep/10 bg-white p-6">
          <h2 className="mb-4 font-serif text-lg text-ink">Registros por día</h2>
          <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
            {a.porDia.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t bg-noema-sage" style={{ height: `${Math.round((n / maxDia) * 100)}%` }} title={`${n}`} />
                </div>
                <span className="text-[11px] text-foreground-muted">{DIAS[i]}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Por hora del día */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-6">
        <h2 className="mb-4 font-serif text-lg text-ink">Horarios con más registros</h2>
        <div className="flex items-end gap-0.5" style={{ height: 120 }}>
          {a.porHora.map((n, h) => (
            <div key={h} className="flex flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t bg-noema-deep/70" style={{ height: `${Math.round((n / maxHora) * 100)}%` }} title={`${h}:00 — ${n}`} />
              </div>
              {h % 3 === 0 && <span className="mt-1 text-[10px] text-foreground-muted">{h}</span>}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-foreground-muted">Hora del día (0–23), según la hora que el paciente registró.</p>
      </section>
    </div>
  );
}
