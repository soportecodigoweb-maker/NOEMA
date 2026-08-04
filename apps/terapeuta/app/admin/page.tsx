import { Stethoscope, HeartHandshake, Building2, Link2, Clock, Archive, TrendingUp, DollarSign, Activity, Star } from 'lucide-react';
import { cargarMetricasOwner, metricasActividad } from './data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Panel de dueño · NOEMA' };

export default async function OwnerPage() {
  const [m, act] = await Promise.all([cargarMetricasOwner(), metricasActividad()]);

  const stats = [
    { label: 'Terapeutas', valor: m.terapeutas, sub: `${m.terapeutasVerificados} verificados`, icon: Stethoscope },
    { label: 'Pacientes', valor: m.pacientes, sub: `${m.nuevos7d} nuevos (7 días)`, icon: HeartHandshake },
    { label: 'Usuarios activos (30 días)', valor: act.activos30d, sub: `${act.activosHoy} activos hoy`, icon: Activity },
    { label: 'Calificación promedio', valor: '—', sub: 'con la encuesta de satisfacción', icon: Star },
    { label: 'Centros', valor: m.centros, sub: 'clínicas registradas', icon: Building2 },
    { label: 'Vinculaciones activas', valor: m.vincActivas, sub: `${m.vincPendientes} pendientes`, icon: Link2 },
    { label: 'Canalizaciones pendientes', valor: m.canalizacionesPendientes, sub: 'esperando al paciente', icon: Clock },
    { label: 'Cuentas archivadas', valor: m.cuentasEliminadas, sub: 'bloqueadas por ley', icon: Archive },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-ink">Panorama de NOEMA</h1>
        <p className="text-sm text-foreground-muted">
          Métricas y actividad de la plataforma. No se muestra el contenido de ningún paciente.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-noema-deep/10 bg-white p-5">
            <div className="flex items-center gap-2 text-foreground-muted">
              <s.icon className="size-4 text-noema-sage" strokeWidth={1.8} />
              <span className="text-xs uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="mt-2 font-serif text-4xl text-ink">{s.valor}</p>
            <p className="mt-1 text-xs text-foreground-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Finanzas */}
      <section className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.06] p-5">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
          <DollarSign className="size-5 text-noema-sage" /> Finanzas
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground-muted">Pacientes facturables</p>
            <p className="mt-1 font-serif text-3xl text-ink">{m.facturables}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground-muted">Ingreso estimado / mes</p>
            <p className="mt-1 font-serif text-3xl text-ink">
              ${m.ingresoEstimadoMXN.toLocaleString('es-MX')} <span className="text-base text-foreground-muted">MXN</span>
            </p>
          </div>
          <div className="flex items-end">
            <p className="text-xs text-foreground-muted">
              Estimado ($100 MXN × paciente activo facturable). El cobro real con Stripe se
              integrará después.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registros recientes */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
            <TrendingUp className="size-5 text-noema-sage" /> Registros recientes
          </h2>
          <ul className="divide-y divide-noema-deep/[0.06] rounded-2xl border border-noema-deep/10 bg-white">
            {m.recientes.length === 0 ? (
              <li className="px-4 py-3 text-sm text-foreground-muted">Sin registros aún.</li>
            ) : (
              m.recientes.map((r, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink">{r.nombre || 'Sin nombre'}</span>
                  <span className="flex items-center gap-2">
                    <span className="rounded bg-noema-sage/10 px-2 py-0.5 text-[11px] text-noema-sage">{r.rol}</span>
                    <span className="text-[11px] text-foreground-muted">{r.fecha}</span>
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Movimientos (auditoría) */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
            <Clock className="size-5 text-noema-sage" /> Actividad reciente
          </h2>
          <ul className="divide-y divide-noema-deep/[0.06] rounded-2xl border border-noema-deep/10 bg-white">
            {m.movimientos.length === 0 ? (
              <li className="px-4 py-3 text-sm text-foreground-muted">Sin actividad registrada.</li>
            ) : (
              m.movimientos.map((mo, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink">
                    {mo.accion} <span className="text-foreground-muted">· {mo.tabla}</span>
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    {mo.rol ?? '—'} · {mo.fecha}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
