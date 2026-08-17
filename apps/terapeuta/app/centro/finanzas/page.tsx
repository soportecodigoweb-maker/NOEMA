import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wallet, TrendingUp, AlertTriangle, Building2, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { finanzasCentro } from '../finanzas-data';
import { ConfigFinanciera, TablaTerapeutas, RegistrarCobro, ListaCobros } from '@/components/centro/FinanzasPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Finanzas · Centro' };

interface PageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function FinanzasCentroPage({ searchParams }: PageProps) {
  const { mes } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const f = await finanzasCentro(user.id, mes);
  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  const mesActual = mes ?? new Date().toISOString().slice(0, 7);

  const kpis = [
    { label: 'Sesiones realizadas', valor: String(f.totalSesiones), icon: UserCheck, nota: 'actividad real' },
    { label: 'Esperado', valor: fmt(f.totalEsperado), icon: TrendingUp, nota: 'sesiones × tarifa' },
    { label: 'Cobrado', valor: fmt(f.totalCobrado), icon: Wallet, nota: 'registrado por recepción' },
    {
      label: 'Diferencia',
      valor: fmt(f.totalDiferencia),
      icon: AlertTriangle,
      nota: Math.abs(f.totalDiferencia) < 0.01 ? 'todo cuadra' : 'revisar',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
            <Wallet className="size-7 text-noema-sage" /> Finanzas
          </h1>
          <p className="text-sm text-foreground-muted">
            La actividad real (sesiones realizadas) se compara con el dinero registrado.
          </p>
        </div>
        <form method="get" className="flex items-end gap-2">
          <label className="block">
            <span className="mb-0.5 block text-xs text-foreground-muted">Mes</span>
            <input
              type="month"
              name="mes"
              defaultValue={mesActual}
              className="rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            />
          </label>
          <button className="rounded-md border border-noema-deep/15 px-3 py-2 text-sm text-ink hover:border-noema-deep/30">
            Ver
          </button>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-noema-deep/10 bg-white p-5">
            <k.icon className="size-5 text-noema-sage" strokeWidth={1.8} />
            <p className="mt-2 font-serif text-3xl text-ink">{k.valor}</p>
            <p className="mt-1 text-xs text-foreground-muted">
              {k.label} · {k.nota}
            </p>
          </div>
        ))}
      </div>

      {/* Reparto */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.06] p-5">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-foreground-muted">
            <Building2 className="size-3.5" /> Para el centro
          </p>
          <p className="mt-1 font-serif text-3xl text-ink">{fmt(f.totalParaCentro)}</p>
        </div>
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Para los terapeutas</p>
          <p className="mt-1 font-serif text-3xl text-ink">{fmt(f.totalParaTerapeutas)}</p>
        </div>
      </div>

      {f.porMetodo.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {f.porMetodo.map((m) => (
            <span key={m.metodo} className="rounded-lg border border-noema-deep/10 bg-white px-3 py-1.5 text-sm">
              <span className="text-foreground-muted capitalize">{m.metodo}:</span>{' '}
              <span className="font-medium text-ink">{fmt(m.total)}</span>
            </span>
          ))}
        </div>
      )}

      <ConfigFinanciera tarifa={f.tarifaCentro} comision={f.comisionCentro} moneda={f.moneda} />

      <div>
        <h2 className="mb-3 font-serif text-lg text-ink">Conciliación por terapeuta</h2>
        <TablaTerapeutas filas={f.filas} moneda={f.moneda} />
      </div>

      <RegistrarCobro terapeutas={f.filas.map((x) => ({ id: x.terapeutaId, nombre: x.nombre }))} />

      <div>
        <h2 className="mb-3 font-serif text-lg text-ink">Cobros del mes</h2>
        <ListaCobros cobros={f.cobros} />
      </div>

      <p className="text-xs text-foreground-muted">
        ¿Falta un terapeuta? Revisa que esté vinculado en{' '}
        <Link href="/centro/terapeutas" className="text-noema-sage hover:underline">Terapeutas</Link>.
      </p>
    </div>
  );
}
