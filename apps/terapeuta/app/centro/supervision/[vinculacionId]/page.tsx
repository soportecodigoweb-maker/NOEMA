import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { procesoSupervision } from '../../data';
import { expedienteSupervision } from '../../expediente-data';
import { RegistrarAccesoSupervision } from '@/components/centro/RegistrarAccesoSupervision';
import { ComentarPractica } from '@/components/centro/ComentarPractica';
import { SolicitarAcceso } from '@/components/centro/SolicitarAcceso';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ vinculacionId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'registros', label: 'Registros' },
  { key: 'diario', label: 'Diario' },
  { key: 'sesiones', label: 'Sesiones y notas' },
  { key: 'ejercicios', label: 'Ejercicios' },
  { key: 'plan', label: 'Plan de apoyo' },
  { key: 'historial', label: 'Historial clínico' },
];

const RIESGO: Record<string, string> = {
  critico: 'bg-[#B85450]/15 text-[#B85450]',
  alto: 'bg-noema-clay/15 text-noema-clay',
  medio: 'bg-emotion-cansado/30 text-ink/70',
  bajo: 'bg-emotion-tranquilo/40 text-ink/70',
  sin_evaluar: 'bg-noema-deep/[0.06] text-ink/60',
};

export default async function SupervisionDetallePage({ params, searchParams }: PageProps) {
  const { vinculacionId } = await params;
  const { tab } = await searchParams;
  const activo = TABS.some((t) => t.key === tab) ? tab! : 'resumen';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const p = await procesoSupervision(user.id, vinculacionId);
  if (p === null) notFound();

  const volver = (
    <Link href="/centro/supervision" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink">
      <ChevronLeft className="size-4" /> Supervisión
    </Link>
  );

  if (!p.permitido) {
    return (
      <div className="space-y-6">
        {volver}
        <div className="flex items-start gap-3 rounded-2xl border border-noema-clay/25 bg-noema-clay/[0.04] p-6">
          <Lock className="mt-0.5 size-5 shrink-0 text-noema-clay" />
          <div>
            <p className="font-medium text-ink">Acceso no autorizado</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Para revisar la información de este paciente necesitas la autorización de{' '}
              {p.terapeutaNombre}. Puedes solicitarla; el terapeuta decide cada vez.
            </p>
          </div>
        </div>
        <SolicitarAcceso vinculacionId={vinculacionId} pendiente={p.solicitudPendiente} />
      </div>
    );
  }

  const e = await expedienteSupervision(vinculacionId);
  if (!e) notFound();

  const card = 'rounded-2xl border border-noema-deep/10 bg-white p-5';
  const vacio = (txt: string) => (
    <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
      {txt}
    </p>
  );

  return (
    <div className="space-y-6">
      {volver}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl text-ink">{e.paciente.nombre}</h1>
            <span className={`rounded px-2 py-0.5 text-[11px] ${RIESGO[e.vinculacion.nivelRiesgo] ?? ''}`}>
              Riesgo: {e.vinculacion.nivelRiesgo.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-foreground-muted">
            Terapeuta: {p.terapeutaNombre} · Desde {e.vinculacion.desde}
          </p>
        </div>
        <RegistrarAccesoSupervision vinculacionId={vinculacionId} />
      </div>

      {/* Pestañas */}
      <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-noema-deep/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/centro/supervision/${vinculacionId}?tab=${t.key}`}
            className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activo === t.key
                ? 'border-noema-sage text-ink'
                : 'border-transparent text-foreground-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* ── Resumen ── */}
      {activo === 'resumen' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: 'Registros compartidos', v: String(e.metricas.registros), n: `intensidad ${e.metricas.intensidadPromedio ?? '—'}/5` },
              { l: 'Sesiones realizadas', v: String(e.metricas.sesionesRealizadas), n: `${e.metricas.sesionesCanceladas} canceladas` },
              { l: 'Adherencia', v: e.metricas.adherencia != null ? `${e.metricas.adherencia}%` : '—', n: `${e.metricas.tareasCompletadas}/${e.metricas.tareas} tareas` },
              { l: 'Alertas de crisis', v: String(e.metricas.alertasCrisis), n: 'histórico' },
            ].map((k) => (
              <div key={k.l} className={card}>
                <p className="font-serif text-3xl text-ink">{k.v}</p>
                <p className="mt-1 text-xs text-foreground-muted">{k.l} · {k.n}</p>
              </div>
            ))}
          </div>

          <section className={card}>
            <h2 className="mb-3 font-serif text-lg text-ink">Datos generales</h2>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { l: 'Correo', v: e.paciente.email },
                { l: 'Edad', v: e.paciente.edad },
                { l: 'Sexo', v: e.paciente.genero || '—' },
                { l: 'Ciudad', v: e.paciente.ciudad || '—' },
                { l: 'Ocupación', v: e.paciente.ocupacion || '—' },
                { l: 'Estado', v: e.vinculacion.estado },
              ].map((x) => (
                <div key={x.l}>
                  <dt className="text-xs uppercase tracking-wider text-foreground-muted">{x.l}</dt>
                  <dd className="truncate text-sm text-ink">{x.v}</dd>
                </div>
              ))}
            </dl>
            {e.paciente.motivos.length > 0 && (
              <p className="mt-3 text-sm text-ink/80">
                <span className="font-medium">Motivo de consulta:</span> {e.paciente.motivos.join(', ')}
              </p>
            )}
          </section>
        </div>
      )}

      {/* ── Registros ── */}
      {activo === 'registros' &&
        (e.registros.length === 0 ? (
          vacio('El paciente no ha compartido registros emocionales.')
        ) : (
          <ul className="space-y-2">
            {e.registros.map((r, i) => (
              <li key={i} className="rounded-xl border border-noema-deep/10 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink capitalize">{r.emocion}</span>
                  <span className="rounded bg-noema-sage/10 px-2 py-0.5 text-[11px] text-noema-sage">
                    {r.intensidad}/5
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {r.fecha}{r.hora ? ` · ${r.hora}` : ''}
                  </span>
                </div>
                {r.detonante && <p className="mt-1 text-sm text-ink/80">{r.detonante}</p>}
                {r.necesidad && <p className="text-xs text-foreground-muted">Necesidad: {r.necesidad}</p>}
              </li>
            ))}
          </ul>
        ))}

      {/* ── Diario ── */}
      {activo === 'diario' &&
        (e.diario.length === 0 ? (
          vacio('El paciente no ha compartido entradas de diario.')
        ) : (
          <ul className="space-y-2">
            {e.diario.map((d, i) => (
              <li key={i} className={card}>
                {d.titulo && <p className="font-medium text-ink">{d.titulo}</p>}
                <p className="text-xs text-foreground-muted">{d.fecha}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink/85">{d.contenido}</p>
              </li>
            ))}
          </ul>
        ))}

      {/* ── Sesiones y notas ── */}
      {activo === 'sesiones' && (
        <div className="space-y-6">
          {/* Notas clínicas del terapeuta */}
          <section>
            <h2 className="mb-2 text-xs uppercase tracking-wider text-foreground-muted">
              Notas clínicas ({e.notasClinicas.length})
            </h2>
            {e.notasClinicas.length === 0 ? (
              vacio('El terapeuta no ha escrito notas clínicas.')
            ) : (
              <ul className="space-y-2">
                {e.notasClinicas.map((n, i) => (
                  <li key={i} className={card}>
                    {n.titulo && <p className="font-medium text-ink">{n.titulo}</p>}
                    <p className="text-xs text-foreground-muted">{n.fecha}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink/85">{n.contenido}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Sesiones */}
          <section>
            <h2 className="mb-2 text-xs uppercase tracking-wider text-foreground-muted">
              Sesiones ({e.sesiones.length})
            </h2>
            {e.sesiones.length === 0 ? (
              vacio('Sin sesiones registradas.')
            ) : (
              <ul className="space-y-2">
            {e.sesiones.map((s, i) => (
              <li key={i} className={card}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{s.fecha}</span>
                  <span className="rounded bg-noema-deep/[0.06] px-2 py-0.5 text-[11px] text-ink/70">{s.estado}</span>
                  {s.modalidad && <span className="text-xs text-foreground-muted">{s.modalidad}</span>}
                </div>
                {s.objetivos.length > 0 && (
                  <p className="mt-1 text-sm text-ink/80">
                    <span className="font-medium">Objetivos:</span> {s.objetivos.join(', ')}
                  </p>
                )}
                {s.notaPublica && <p className="mt-1 whitespace-pre-wrap text-sm text-ink/85">{s.notaPublica}</p>}
                {s.notaPrivada && (
                  <p className="mt-1 whitespace-pre-wrap rounded-lg bg-paper/60 p-2 text-sm text-ink/75">
                    <span className="text-[11px] uppercase tracking-wider text-foreground-muted">Nota privada del terapeuta</span>
                    <br />
                    {s.notaPrivada}
                  </p>
                )}
                {s.plan && (
                  <p className="mt-1 text-sm text-ink/80">
                    <span className="font-medium">Plan:</span> {s.plan}
                  </p>
                )}
              </li>
            ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ── Ejercicios ── */}
      {activo === 'ejercicios' &&
        (e.ejercicios.length === 0 ? (
          vacio('No se han asignado ejercicios.')
        ) : (
          <ul className="space-y-2">
            {e.ejercicios.map((x, i) => (
              <li key={i} className={card}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{x.titulo}</span>
                  <span className="rounded bg-noema-deep/[0.06] px-2 py-0.5 text-[11px] text-ink/70">{x.estado}</span>
                  {x.fechaLimite && <span className="text-xs text-foreground-muted">hasta {x.fechaLimite}</span>}
                </div>
                {x.respuestas.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {x.respuestas.map((r, k) => (
                      <div key={k} className="border-l-2 border-noema-sage/30 pl-3">
                        {r.tabla && (
                          <div className="mb-2 overflow-x-auto rounded-lg border border-noema-deep/10">
                            <table className="w-full min-w-[420px] text-xs">
                              <thead>
                                <tr className="bg-paper/60">
                                  {r.tabla.columnas.map((c, ci) => (
                                    <th key={ci} className="border-b border-noema-deep/10 px-2.5 py-1.5 text-left font-medium text-ink/70">{c}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {r.tabla.filas.map((fila, fi) => (
                                  <tr key={fi} className="border-b border-noema-deep/[0.06] last:border-0">
                                    {r.tabla!.columnas.map((_, ci) => (
                                      <td key={ci} className="whitespace-pre-wrap px-2.5 py-1.5 align-top text-ink/85">{fila[ci] || '—'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {r.valores.length > 0 && (
                          <dl className="mb-1.5 space-y-1">
                            {r.valores.map((v, vi) => (
                              <div key={vi}>
                                <dt className="text-xs font-medium text-ink/70">{v.label}</dt>
                                <dd className="whitespace-pre-wrap text-sm text-ink/85">{v.valor}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {r.texto && <p className="text-sm italic text-ink/80">"{r.texto}"</p>}
                        <p className="text-xs text-foreground-muted">
                          {r.fecha}
                          {r.dificultad != null && ` · dificultad ${r.dificultad}/5`}
                        </p>
                        {r.retro && (
                          <p className="mt-0.5 text-xs text-noema-sage">Retroalimentación: {r.retro}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ))}

      {/* ── Plan de apoyo ── */}
      {activo === 'plan' &&
        (!e.planApoyo ? (
          vacio('Este paciente no tiene plan de apoyo configurado.')
        ) : (
          <div className="space-y-4">
            <section className={card}>
              <h2 className="mb-2 font-serif text-lg text-ink">Plan de seguridad</h2>
              {e.planApoyo.contacto && (
                <p className="mb-2 text-sm text-ink/80">
                  <span className="font-medium">Contacto de confianza:</span> {e.planApoyo.contacto}
                </p>
              )}
              <p className="whitespace-pre-wrap text-sm text-ink/85">
                {e.planApoyo.planSeguridad || 'Sin plan escrito.'}
              </p>
              <p className="mt-2 text-xs text-foreground-muted">
                Veces que usó su plan de apoyo: {e.planApoyo.usos}
              </p>
            </section>
            {e.planApoyo.recursos.length > 0 && (
              <section className={card}>
                <h2 className="mb-2 font-serif text-lg text-ink">Recursos asignados</h2>
                <ul className="space-y-1 text-sm text-ink/80">
                  {e.planApoyo.recursos.map((r, i) => (
                    <li key={i}>· {r.titulo} <span className="text-xs text-foreground-muted">({r.tipo})</span></li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ))}

      {/* ── Historial clínico ── */}
      {activo === 'historial' &&
        (!e.expedienteInicial ? (
          vacio('El terapeuta aún no ha llenado el expediente inicial.')
        ) : (
          <section className={card}>
            <h2 className="mb-3 font-serif text-lg text-ink">Expediente inicial</h2>
            <dl className="space-y-3">
              {Object.entries(e.expedienteInicial)
                .filter(([k, v]) => !['id', 'vinculacion_id', 'creado_at', 'actualizado_at'].includes(k) && v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wider text-foreground-muted">
                      {k.replace(/_/g, ' ')}
                    </dt>
                    <dd className="whitespace-pre-wrap text-sm text-ink/85">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}

      {/* Aviso de privacidad de la supervisión */}
      <p className="flex items-start gap-2 rounded-xl border border-noema-deep/10 bg-white/60 p-3 text-xs text-foreground-muted">
        <Eye className="mt-0.5 size-3.5 shrink-0 text-noema-sage" />
        Vista de supervisión en solo lectura. Muestra lo mismo que ve el terapeuta, excepto lo que el
        paciente marcó como privado (eso nunca sale de su cuenta). Tu acceso quedó registrado.
      </p>

      <ComentarPractica terapeutaId={p.terapeutaId} />
    </div>
  );
}
