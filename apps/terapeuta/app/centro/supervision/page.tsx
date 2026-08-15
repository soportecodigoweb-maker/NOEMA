import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Eye, Check, Clock, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { datosSupervision } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Supervisión · Centro' };

export default async function SupervisionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const s = await datosSupervision(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Eye className="size-7 text-noema-sage" /> Supervisión clínica
        </h1>
        <p className="text-sm text-foreground-muted">
          {s.activa
            ? 'Supervisión activada. Solo ves a los pacientes de terapeutas que ya autorizaron.'
            : 'Supervisión desactivada. Actívala desde Inicio para supervisar el proceso de los pacientes.'}
        </p>
      </div>

      {s.terapeutas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
          No hay terapeutas vinculados todavía.
        </p>
      ) : (
        <div className="space-y-4">
          {s.terapeutas.map((t) => {
            const puedeVer = s.activa && t.autorizada;
            return (
              <section key={t.terapeutaId} className="rounded-2xl border border-noema-deep/10 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-serif text-lg text-ink">{t.nombre}</h2>
                  {t.autorizada ? (
                    <span className="inline-flex items-center gap-1 rounded bg-noema-sage/10 px-2 py-0.5 text-[11px] text-noema-sage">
                      <Check className="size-3" /> Autorizó supervisión
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-noema-clay/10 px-2 py-0.5 text-[11px] text-noema-clay">
                      <Clock className="size-3" /> Pendiente de autorizar
                    </span>
                  )}
                </div>

                {t.pacientes.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Sin pacientes activos.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {t.pacientes.map((p) =>
                      puedeVer ? (
                        <li key={p.vinculacionId}>
                          <Link
                            href={`/centro/supervision/${p.vinculacionId}`}
                            className="flex items-center gap-3 rounded-lg border border-noema-deep/10 px-3 py-2 text-sm transition-colors hover:border-noema-sage/40"
                          >
                            <span className="flex-1 text-ink">{p.nombre}</span>
                            <span className="text-xs text-noema-sage">Ver proceso</span>
                            <ChevronRight className="size-4 text-foreground-muted" />
                          </Link>
                        </li>
                      ) : (
                        <li
                          key={p.vinculacionId}
                          className="flex items-center gap-3 rounded-lg border border-noema-deep/[0.06] px-3 py-2 text-sm text-foreground-muted"
                        >
                          <span className="flex-1">{p.nombre}</span>
                          <span className="text-xs">Requiere autorización</span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
