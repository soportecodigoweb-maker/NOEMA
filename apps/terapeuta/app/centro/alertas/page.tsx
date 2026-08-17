import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BellRing, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { datosAlertas } from '../alertas-data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Alertas · Centro' };

const SEMAFORO = {
  bien: { label: 'Bien', clase: 'bg-emotion-tranquilo/40 text-ink/70', barra: 'bg-noema-sage' },
  atencion: { label: 'Atención', clase: 'bg-emotion-cansado/30 text-ink/70', barra: 'bg-noema-clay' },
  riesgo: { label: 'Revisar', clase: 'bg-[#B85450]/15 text-[#B85450]', barra: 'bg-[#B85450]' },
} as const;

export default async function AlertasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { indicadores, casos } = await datosAlertas(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <BellRing className="size-7 text-noema-sage" /> Alertas e indicadores
        </h1>
        <p className="text-sm text-foreground-muted">
          Desempeño medido con señales objetivas de los últimos 60 días. Sin contenido clínico.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-noema-deep/10 bg-white/60 p-3 text-xs text-foreground-muted">
        <Info className="mt-0.5 size-3.5 shrink-0 text-noema-sage" />
        <p>
          El puntaje combina <span className="font-medium text-ink">adherencia</span> (tareas que el
          paciente completa), <span className="font-medium text-ink">notas al día</span> (sesiones con
          nota clínica) y <span className="font-medium text-ink">baja cancelación</span>. Es una señal
          para mirar, no un juicio: úsalo para acompañar al terapeuta.
        </p>
      </div>

      {/* Indicadores por terapeuta */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-ink">Terapeutas</h2>
        {indicadores.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
            No hay terapeutas vinculados.
          </p>
        ) : (
          <ul className="space-y-3">
            {indicadores.map((i) => {
              const s = SEMAFORO[i.semaforo];
              return (
                <li key={i.terapeutaId} className="rounded-2xl border border-noema-deep/10 bg-white p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/centro/terapeutas/${i.terapeutaId}`} className="font-medium text-ink hover:underline">
                      {i.nombre}
                    </Link>
                    <span className={`rounded px-2 py-0.5 text-[11px] ${s.clase}`}>
                      {s.label} · {i.puntaje}/100
                    </span>
                  </div>

                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-noema-deep/[0.06]">
                    <div className={`h-full rounded-full ${s.barra}`} style={{ width: `${i.puntaje}%` }} />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                    <div>
                      <dt className="text-foreground-muted">Pacientes</dt>
                      <dd className="font-medium text-ink">{i.pacientes}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground-muted">Sesiones</dt>
                      <dd className="font-medium text-ink">
                        {i.sesionesRealizadas}
                        {i.sesionesCanceladas > 0 && (
                          <span className="text-foreground-muted"> · {i.sesionesCanceladas} canc.</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-foreground-muted">Adherencia</dt>
                      <dd className="font-medium text-ink">{i.adherencia != null ? `${i.adherencia}%` : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground-muted">Notas al día</dt>
                      <dd className="font-medium text-ink">{i.notasAlDia}%</dd>
                    </div>
                    <div>
                      <dt className="text-foreground-muted">Tareas</dt>
                      <dd className="font-medium text-ink">
                        {i.tareasCompletadas}/{i.tareasAsignadas}
                      </dd>
                    </div>
                  </dl>

                  {i.alertas.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {i.alertas.map((a, k) => (
                        <li key={k} className="inline-flex items-center gap-1.5 text-xs text-noema-clay">
                          <AlertTriangle className="size-3.5" /> {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Casos que requieren atención */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-ink">Casos a revisar</h2>
        {casos.length === 0 ? (
          <p className="inline-flex items-center gap-2 rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.06] p-4 text-sm text-noema-sage">
            <ShieldCheck className="size-4" /> Sin casos que requieran atención.
          </p>
        ) : (
          <ul className="divide-y divide-noema-deep/[0.06] rounded-2xl border border-noema-deep/10 bg-white">
            {casos.map((c, i) => (
              <li key={`${c.vinculacionId}-${i}`} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[11px] ${
                    c.severidad === 'alta' ? 'bg-[#B85450]/15 text-[#B85450]' : 'bg-emotion-cansado/30 text-ink/70'
                  }`}
                >
                  {c.severidad === 'alta' ? 'Alta' : 'Media'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-ink">{c.motivo}</span>
                  <span className="block text-xs text-foreground-muted">
                    {c.paciente} · con {c.terapeuta}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
