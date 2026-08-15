import { redirect } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Users, HeartPulse, CalendarCheck, ArrowRightLeft, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { estadisticasCentro } from './data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Centro terapéutico' };

export default async function CentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [{ data: centro }, e] = await Promise.all([
    supabase.from('centros').select('nombre_centro, codigo_centro, ciudad').eq('profile_id', user.id).maybeSingle(),
    estadisticasCentro(user.id),
  ]);

  const stats = [
    { label: 'Terapeutas', valor: e.terapeutas, icon: Users },
    { label: 'Pacientes activos', valor: e.pacientesActivos, icon: HeartPulse },
    { label: 'Sesiones del mes', valor: e.sesionesMes, icon: CalendarCheck },
    { label: 'Canalizaciones', valor: e.canalizaciones, icon: ArrowRightLeft },
    { label: 'Altas (30 días)', valor: e.altas30d, icon: TrendingUp },
    { label: 'Bajas (30 días)', valor: e.bajas30d, icon: TrendingDown },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-ink">{centro?.nombre_centro ?? 'Tu centro'}</h1>
        {centro?.ciudad && <p className="text-sm text-foreground-muted">{centro.ciudad}</p>}
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-noema-deep/10 bg-white p-5">
            <s.icon className="size-5 text-noema-sage" strokeWidth={1.8} />
            <p className="mt-2 font-serif text-4xl text-ink">{s.valor}</p>
            <p className="mt-1 text-xs text-foreground-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Código del centro */}
        <section className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.06] p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <KeyRound className="size-4 text-noema-sage" /> Código de tu centro
          </h2>
          <p className="mb-3 text-sm text-foreground-muted">
            Compártelo con tus terapeutas para que se vinculen desde su panel (Ajustes → Centro
            terapéutico).
          </p>
          <div className="inline-flex items-center rounded-lg border border-noema-deep/15 bg-white px-4 py-2 font-mono text-lg tracking-wider text-ink">
            {centro?.codigo_centro ?? '—'}
          </div>
        </section>

        {/* Acceso a terapeutas */}
        <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <Users className="size-4 text-noema-sage" /> Terapeutas y pacientes
          </h2>
          <p className="mb-4 text-sm text-foreground-muted">
            Revisa a cada terapeuta, sus pacientes y da continuidad reasignando cuando alguien se va.
          </p>
          <Link
            href="/centro/terapeutas"
            className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
          >
            Ver terapeutas <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
