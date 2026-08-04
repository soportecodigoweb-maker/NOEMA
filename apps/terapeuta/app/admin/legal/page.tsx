import { Scale, FileCheck2, Trash2 } from 'lucide-react';
import { cargarLegal } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Centro legal · Panel de dueño' };

export default async function LegalPage() {
  const l = await cargarLegal();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Scale className="size-7 text-noema-sage" /> Centro legal
        </h1>
        <p className="text-sm text-foreground-muted">
          Consentimientos, versiones de aviso y solicitudes de eliminación. Retención de
          respaldo legal: 5 años.
        </p>
      </div>

      {/* Versiones de aviso aceptadas */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
          <FileCheck2 className="size-5 text-noema-sage" /> Aceptaciones por versión de aviso
          <span className="text-sm font-normal text-foreground-muted">
            ({l.totalConsentimientos} en total)
          </span>
        </h2>
        {l.porVersion.length === 0 ? (
          <p className="text-sm text-foreground-muted">Aún no hay consentimientos registrados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {l.porVersion.map((v) => (
              <span key={v.version} className="rounded-lg border border-noema-deep/10 px-3 py-1.5 text-sm">
                <span className="font-mono text-xs text-foreground-muted">{v.version}</span>
                <span className="ml-2 font-medium text-ink">{v.n}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Consentimientos recientes */}
        <section>
          <h2 className="mb-3 font-serif text-lg text-ink">Consentimientos recientes</h2>
          <ul className="divide-y divide-noema-deep/[0.06] rounded-2xl border border-noema-deep/10 bg-white">
            {l.consentimientos.length === 0 ? (
              <li className="px-4 py-3 text-sm text-foreground-muted">Sin registros.</li>
            ) : (
              l.consentimientos.map((c, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{c.usuario}</span>
                    <span className="text-xs text-foreground-muted">
                      {c.tipo} · <span className="font-mono">{c.version}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-foreground-muted">{c.fecha}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Solicitudes de eliminación */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
            <Trash2 className="size-5 text-noema-clay" /> Solicitudes de eliminación
          </h2>
          <ul className="divide-y divide-noema-deep/[0.06] rounded-2xl border border-noema-deep/10 bg-white">
            {l.eliminadas.length === 0 ? (
              <li className="px-4 py-3 text-sm text-foreground-muted">Ninguna cuenta eliminada.</li>
            ) : (
              l.eliminadas.map((e, i) => (
                <li key={i} className="px-4 py-2.5 text-sm">
                  <span className="block text-ink">{e.usuario}</span>
                  <span className="text-xs text-foreground-muted">
                    Eliminada {e.eliminada} · se purga el {e.purga}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <p className="rounded-xl border border-dashed border-noema-deep/15 bg-white/60 p-4 text-xs text-foreground-muted">
        Las solicitudes ARCO y las exportaciones se registrarán aquí conforme se construyan esos
        flujos. Los textos y plazos de retención deben validarse con un especialista en protección
        de datos (LFPDPPP).
      </p>
    </div>
  );
}
