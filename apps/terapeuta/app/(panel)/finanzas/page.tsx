import { createClient } from '@/lib/supabase/server';
import { Wallet, TrendingUp, Clock, Users } from 'lucide-react';
import { perfilesPorId } from '@/lib/perfiles-lookup';
import { formatFecha } from '@/lib/utils';
import { RegistrarPago } from '@/components/finanzas/RegistrarPago';
import { MarcarPagado } from '@/components/finanzas/MarcarPagado';

export const metadata = { title: 'Finanzas' };
export const dynamic = 'force-dynamic';

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  en_linea: 'En línea',
  otro: 'Otro',
};

function mxn(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default async function FinanzasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: pagos }, { data: vincs }] = await Promise.all([
    supabase
      .from('pagos_pacientes')
      .select('id, vinculacion_id, monto, concepto, metodo, estado, fecha')
      .eq('terapeuta_id', user.id)
      .order('fecha', { ascending: false }),
    supabase
      .from('vinculaciones')
      .select('id, paciente_id')
      .eq('terapeuta_id', user.id)
      .eq('estado', 'activa'),
  ]);

  const pagosList = pagos ?? [];
  const perfiles = await perfilesPorId(supabase, (vincs ?? []).map((v) => v.paciente_id));
  const nombrePorVinc = new Map<string, string>();
  for (const v of vincs ?? []) {
    nombrePorVinc.set(v.id, (v.paciente_id ? perfiles.get(v.paciente_id)?.nombre : null) ?? 'Paciente');
  }
  const opcionesPaciente = (vincs ?? []).map((v) => ({
    vinculacionId: v.id,
    nombre: (v.paciente_id ? perfiles.get(v.paciente_id)?.nombre : null) ?? 'Paciente',
  }));

  // Métricas
  const pagados = pagosList.filter((p) => p.estado === 'pagado');
  const pendientes = pagosList.filter((p) => p.estado === 'pendiente');
  const totalPagado = pagados.reduce((s, p) => s + Number(p.monto), 0);
  const totalPendiente = pendientes.reduce((s, p) => s + Number(p.monto), 0);

  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();
  const totalMes = pagados
    .filter((p) => {
      const d = new Date(p.fecha);
      return d.getMonth() === mesActual && d.getFullYear() === anioActual;
    })
    .reduce((s, p) => s + Number(p.monto), 0);

  const pacientesConPago = new Set(pagados.map((p) => p.vinculacion_id)).size;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-ink">Finanzas</h1>
          <p className="mt-2 text-foreground-muted">
            Tus ingresos por paciente. Registra pagos en efectivo o transferencia.
          </p>
        </div>
        <RegistrarPago pacientes={opcionesPaciente} />
      </div>

      {/* Métricas */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metrica icono={<TrendingUp className="size-4" />} label="Ingreso este mes" valor={mxn(totalMes)} />
        <Metrica icono={<Wallet className="size-4" />} label="Total cobrado" valor={mxn(totalPagado)} />
        <Metrica icono={<Clock className="size-4" />} label="Por cobrar" valor={mxn(totalPendiente)} destacar={totalPendiente > 0} />
        <Metrica icono={<Users className="size-4" />} label="Pacientes que pagan" valor={`${pacientesConPago}`} />
      </div>

      {/* Pendientes destacados */}
      {pendientes.length > 0 && (
        <div className="mb-8">
          <h2 className="caption mb-3">Pagos pendientes ({pendientes.length})</h2>
          <div className="space-y-2">
            {pendientes.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    {p.vinculacion_id ? nombrePorVinc.get(p.vinculacion_id) ?? 'Paciente' : 'General'}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {p.concepto ?? 'Pago'} · {formatFecha(p.fecha)}
                  </p>
                </div>
                <span className="font-medium text-ink">{mxn(Number(p.monto))}</span>
                <MarcarPagado pagoId={p.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <h2 className="caption mb-3">Historial de pagos</h2>
        {pagados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white py-12 text-center text-foreground-muted">
            Aún no has registrado pagos. Usa “Registrar pago”.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-noema-deep/10 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-noema-deep/8 text-left text-xs uppercase tracking-wider text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Paciente</th>
                  <th className="px-4 py-3 font-medium">Concepto</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-noema-deep/[0.06]">
                {pagados.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-ink">
                      {p.vinculacion_id ? nombrePorVinc.get(p.vinculacion_id) ?? 'Paciente' : 'General'}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{p.concepto ?? '—'}</td>
                    <td className="px-4 py-3 text-ink/70">{METODO_LABEL[p.metodo] ?? p.metodo}</td>
                    <td className="px-4 py-3 text-ink/70">{formatFecha(p.fecha)}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">{mxn(Number(p.monto))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Metrica({
  icono,
  label,
  valor,
  destacar,
}: {
  icono: React.ReactNode;
  label: string;
  valor: string;
  destacar?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 ${destacar ? 'bg-amber-400/10' : 'bg-noema-sage/8'}`}>
      <div className={`mb-1 ${destacar ? 'text-amber-700' : 'text-noema-sage'}`}>{icono}</div>
      <p className="font-serif text-xl text-ink">{valor}</p>
      <p className="text-[11px] leading-tight text-foreground-muted">{label}</p>
    </div>
  );
}
