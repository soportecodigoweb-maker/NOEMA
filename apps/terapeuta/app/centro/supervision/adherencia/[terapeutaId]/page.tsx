import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Activity, Lightbulb, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { adherenciaDeTerapeuta } from '../../../adherencia-data';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ terapeutaId: string }>;
}

const SEMAFORO: Record<string, { label: string; clase: string }> = {
  bien: { label: 'En marcha', clase: 'bg-emotion-tranquilo/40 text-ink/70' },
  atencion: { label: 'Atención', clase: 'bg-emotion-cansado/40 text-ink/70' },
  riesgo: { label: 'Requiere revisión', clase: 'bg-[#B85450]/15 text-[#B85450]' },
};

export default async function AdherenciaPage({ params }: PageProps) {
  const { terapeutaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const a = await adherenciaDeTerapeuta(user.id, terapeutaId);
  if (!a) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/centro/supervision"
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" /> Supervisión
      </Link>

      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Activity className="size-7 text-noema-sage" /> Adherencia · {a.nombre}
        </h1>
        <p className="text-sm text-foreground-muted">
          Cómo va cada proceso y qué prácticas se asocian a mejores resultados. Son indicadores de
          actividad, no contenido clínico.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <p className="font-serif text-4xl text-ink">{a.totalPacientes}</p>
          <p className="mt-1 text-xs text-foreground-muted">Pacientes en seguimiento</p>
        </div>
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <p className="font-serif text-4xl text-ink">
            {a.promedioAdherencia != null ? `${a.promedioAdherencia}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Adherencia promedio</p>
        </div>
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <p className="font-serif text-4xl text-ink">{a.enRiesgo}</p>
          <p className="mt-1 text-xs text-foreground-muted">Casos que requieren revisión</p>
        </div>
      </div>

      {/* Qué funciona */}
      {a.hallazgos.length > 0 && (
        <section className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.06] p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg text-ink">
            <Lightbulb className="size-5 text-noema-sage" /> Qué se asocia a mejores resultados
          </h2>
          <ul className="space-y-1.5 text-sm text-ink/85">
            {a.hallazgos.map((h, i) => (
              <li key={i}>· {h}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-foreground-muted">
            Comparativa entre los propios pacientes de este terapeuta. Es una observación, no una
            conclusión clínica.
          </p>
        </section>
      )}

      {/* Tabla por paciente */}
      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-foreground-muted">
          Detalle por paciente
        </h2>
        {a.pacientes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
            Este terapeuta no tiene pacientes activos.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-noema-deep/10 bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-noema-deep/[0.08] text-left text-xs uppercase tracking-wider text-foreground-muted">
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Adherencia</th>
                  <th className="px-4 py-3 font-medium">Tareas</th>
                  <th className="px-4 py-3 font-medium">Registros 30d</th>
                  <th className="px-4 py-3 font-medium">Sesiones</th>
                  <th className="px-4 py-3 font-medium">Seguimiento</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {a.pacientes.map((p) => {
                  const sem = SEMAFORO[p.semaforo]!;
                  return (
                    <tr key={p.vinculacionId} className="border-b border-noema-deep/[0.04] last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{p.nombre}</p>
                        {p.diasSinActividad != null && (
                          <p className="text-xs text-foreground-muted">
                            última actividad hace {p.diasSinActividad} día(s)
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-[11px] ${sem.clase}`}>{sem.label}</span>
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {p.adherencia != null ? `${p.adherencia}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {p.tareasCompletadas}/{p.tareasAsignadas}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">{p.registros30}</td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {p.sesionesRealizadas}
                        {p.sesionesCanceladas > 0 && (
                          <span className="text-[#B85450]"> ({p.sesionesCanceladas} canc.)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {p.notasTerapeuta} notas · {p.retroalimentaciones} retro
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/centro/supervision/${p.vinculacionId}`}
                          className="inline-flex items-center gap-1 text-xs text-noema-sage hover:underline"
                        >
                          Ver caso <ChevronRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
