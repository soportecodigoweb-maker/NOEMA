import { createClient } from '@/lib/supabase/server';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Receipt,
  Boxes,
  Clock,
} from 'lucide-react';
import { perfilesPorId } from '@/lib/perfiles-lookup';
import { formatFecha } from '@/lib/utils';
import { RegistrarPago } from '@/components/finanzas/RegistrarPago';
import { MarcarPagado } from '@/components/finanzas/MarcarPagado';
import { Dona, Tendencia } from '@/components/charts/Charts';
import {
  AgregarMovimiento,
  AgregarActivo,
  FilaMovimiento,
  FilaActivo,
  EditorTasaImpuesto,
  type Movimiento,
  type Activo,
} from '@/components/finanzas/GestorFinanzas';

export const metadata = { title: 'Finanzas' };
export const dynamic = 'force-dynamic';

function mxn(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}
function mxnExacto(n: number): string {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export default async function FinanzasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: pagos }, { data: vincs }, { data: movimientos }, { data: activos }, { data: config }] =
    await Promise.all([
      supabase
        .from('pagos_pacientes')
        .select('id, vinculacion_id, monto, concepto, metodo, estado, fecha')
        .eq('terapeuta_id', user.id)
        .order('fecha', { ascending: false }),
      supabase.from('vinculaciones').select('id, paciente_id').eq('terapeuta_id', user.id).eq('estado', 'activa'),
      supabase
        .from('finanzas_movimientos')
        .select('id, tipo, categoria, concepto, monto, fecha, recurrente')
        .eq('terapeuta_id', user.id)
        .order('fecha', { ascending: false }),
      supabase
        .from('finanzas_activos')
        .select('id, nombre, categoria, valor, fecha_adquisicion')
        .eq('terapeuta_id', user.id)
        .order('valor', { ascending: false }),
      supabase.from('finanzas_config').select('tasa_impuesto_pct').eq('terapeuta_id', user.id).maybeSingle(),
    ]);

  const pagosList = pagos ?? [];
  const movs = (movimientos ?? []) as Movimiento[];
  const activosList = (activos ?? []) as Activo[];
  const tasaImpuesto = Number(config?.tasa_impuesto_pct ?? 0);

  const perfiles = await perfilesPorId(supabase, (vincs ?? []).map((v) => v.paciente_id));
  const nombrePorVinc = new Map<string, string>();
  for (const v of vincs ?? []) {
    nombrePorVinc.set(v.id, (v.paciente_id ? perfiles.get(v.paciente_id)?.nombre : null) ?? 'Paciente');
  }
  const opcionesPaciente = (vincs ?? []).map((v) => ({
    vinculacionId: v.id,
    nombre: (v.paciente_id ? perfiles.get(v.paciente_id)?.nombre : null) ?? 'Paciente',
  }));

  const ahora = new Date();
  const enMes = (iso: string, m: number, y: number) => {
    const d = new Date(iso);
    return d.getMonth() === m && d.getFullYear() === y;
  };

  // ── Ingresos (pagos pagados + otros ingresos) ──
  const pagados = pagosList.filter((p) => p.estado === 'pagado');
  const pendientes = pagosList.filter((p) => p.estado === 'pendiente');
  const otrosIngresos = movs.filter((m) => m.tipo === 'ingreso_otro');
  const gastosFijos = movs.filter((m) => m.tipo === 'gasto_fijo');
  const gastosVariables = movs.filter((m) => m.tipo === 'gasto_variable');
  const impuestos = movs.filter((m) => m.tipo === 'impuesto');

  const sum = (arr: { monto: number }[]) => arr.reduce((s, x) => s + Number(x.monto), 0);
  const sumPagos = (arr: { monto: number }[]) => arr.reduce((s, x) => s + Number(x.monto), 0);

  // Del mes actual
  const m = ahora.getMonth();
  const y = ahora.getFullYear();
  const ingresosMes =
    sumPagos(pagados.filter((p) => enMes(p.fecha, m, y))) + sum(otrosIngresos.filter((x) => enMes(x.fecha, m, y)));
  // Los gastos fijos recurrentes cuentan cada mes; si no hay recurrentes, se
  // toman los registrados en el mes.
  const gastosFijosMesReal =
    sum(gastosFijos.filter((x) => x.recurrente)) || sum(gastosFijos.filter((x) => enMes(x.fecha, m, y)));
  const gastosVarMes = sum(gastosVariables.filter((x) => enMes(x.fecha, m, y)));
  const impuestosMes = sum(impuestos.filter((x) => enMes(x.fecha, m, y)));

  const gastosMes = gastosFijosMesReal + gastosVarMes + impuestosMes;
  const impuestoEstimado = ingresosMes * (tasaImpuesto / 100);
  const utilidadMes = ingresosMes - gastosMes;
  const margen = ingresosMes > 0 ? Math.round((utilidadMes / ingresosMes) * 100) : null;

  // Mes anterior (para tendencia de ingresos)
  const mAnt = m === 0 ? 11 : m - 1;
  const yAnt = m === 0 ? y - 1 : y;
  const ingresosMesAnt =
    sumPagos(pagados.filter((p) => enMes(p.fecha, mAnt, yAnt))) + sum(otrosIngresos.filter((x) => enMes(x.fecha, mAnt, yAnt)));
  const deltaIngresos = ingresosMesAnt > 0 ? Math.round(((ingresosMes - ingresosMesAnt) / ingresosMesAnt) * 100) : null;

  // ── Serie 6 meses: ingresos vs gastos ──
  const serie: { label: string; ingreso: number; gasto: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dref = new Date(y, m - i, 1);
    const mm = dref.getMonth();
    const yy = dref.getFullYear();
    const ing = sumPagos(pagados.filter((p) => enMes(p.fecha, mm, yy))) + sum(otrosIngresos.filter((x) => enMes(x.fecha, mm, yy)));
    const gas =
      sum(gastosVariables.filter((x) => enMes(x.fecha, mm, yy))) +
      sum(impuestos.filter((x) => enMes(x.fecha, mm, yy))) +
      sum(gastosFijos.filter((x) => x.recurrente));
    serie.push({ label: MESES[mm]!, ingreso: ing, gasto: gas });
  }
  const maxSerie = Math.max(...serie.map((s) => Math.max(s.ingreso, s.gasto)), 1);

  const totalActivos = activosList.reduce((s, a) => s + Number(a.valor), 0);
  const totalPendiente = sumPagos(pendientes);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-ink">Finanzas</h1>
          <p className="mt-2 text-foreground-muted">
            Tu negocio en números: ingresos, gastos, impuestos, activos y utilidad.
          </p>
        </div>
        <RegistrarPago pacientes={opcionesPaciente} />
      </div>

      {/* Métricas principales del mes */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica
          icono={<TrendingUp className="size-4" />}
          label="Ingresos del mes"
          valor={mxn(ingresosMes)}
          extra={<Tendencia delta={deltaIngresos} />}
          tono="verde"
        />
        <Metrica icono={<TrendingDown className="size-4" />} label="Gastos del mes" valor={mxn(gastosMes)} tono="clay" />
        <Metrica
          icono={<Wallet className="size-4" />}
          label="Utilidad del mes"
          valor={mxn(utilidadMes)}
          extra={margen !== null ? <span className="text-xs text-foreground-muted">margen {margen}%</span> : undefined}
          tono={utilidadMes >= 0 ? 'verde' : 'clay'}
        />
        <Metrica
          icono={<Receipt className="size-4" />}
          label={`Impuesto estimado (${tasaImpuesto}%)`}
          valor={mxn(impuestoEstimado)}
        />
      </div>

      {/* Gráficos */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 font-serif text-lg text-ink">Ingresos vs gastos (6 meses)</h2>
          <div className="flex items-end gap-3" style={{ height: 150 }}>
            {serie.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: 120 }}>
                  <div
                    className="w-1/2 rounded-t bg-noema-sage"
                    style={{ height: `${Math.max(2, (s.ingreso / maxSerie) * 100)}%` }}
                    title={`Ingresos ${MESES[i]}: ${mxnExacto(s.ingreso)}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-noema-clay/70"
                    style={{ height: `${Math.max(2, (s.gasto / maxSerie) * 100)}%` }}
                    title={`Gastos ${MESES[i]}: ${mxnExacto(s.gasto)}`}
                  />
                </div>
                <span className="text-[10px] uppercase text-foreground-muted">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-noema-sage" /> Ingresos</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-noema-clay/70" /> Gastos</span>
          </div>
        </div>

        {/* Composición de gastos del mes */}
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-6">
          <h2 className="mb-3 font-serif text-lg text-ink">Gastos del mes</h2>
          {gastosMes === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">Sin gastos registrados este mes.</p>
          ) : (
            <div className="flex items-center gap-4">
              <Dona
                size={110}
                grosor={16}
                segmentos={[
                  { label: 'Fijos', valor: gastosFijosMesReal, color: '#3D4D3E' },
                  { label: 'Variables', valor: gastosVarMes, color: '#D9B98C' },
                  { label: 'Impuestos', valor: impuestosMes, color: '#B85450' },
                ]}
                centro={<span className="font-serif text-base text-ink">{mxn(gastosMes)}</span>}
              />
              <ul className="flex-1 space-y-1.5 text-sm">
                <Ley color="#3D4D3E" label="Fijos" n={mxn(gastosFijosMesReal)} />
                <Ley color="#D9B98C" label="Variables" n={mxn(gastosVarMes)} />
                <Ley color="#B85450" label="Impuestos" n={mxn(impuestosMes)} />
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Secciones de gestión */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SeccionMovs
          titulo="Gastos fijos"
          descripcion="Renta, servicios, suscripciones — cada mes."
          total={sum(gastosFijos)}
          movs={gastosFijos}
          agregar={<AgregarMovimiento tipo="gasto_fijo" etiqueta="Agregar" categorias={['renta', 'servicios', 'internet', 'software', 'seguro']} />}
        />
        <SeccionMovs
          titulo="Gastos variables"
          descripcion="Materiales, transporte, capacitación, etc."
          total={sum(gastosVariables)}
          movs={gastosVariables}
          agregar={<AgregarMovimiento tipo="gasto_variable" etiqueta="Agregar" categorias={['materiales', 'transporte', 'capacitacion', 'marketing']} />}
        />
        <SeccionMovs
          titulo="Impuestos pagados"
          descripcion="ISR, IVA y otras contribuciones."
          total={sum(impuestos)}
          movs={impuestos}
          agregar={<AgregarMovimiento tipo="impuesto" etiqueta="Agregar" categorias={['ISR', 'IVA', 'cuota fija']} />}
        />
        <SeccionMovs
          titulo="Otros ingresos"
          descripcion="Talleres, cursos, honorarios extra."
          total={sum(otrosIngresos)}
          movs={otrosIngresos}
          agregar={<AgregarMovimiento tipo="ingreso_otro" etiqueta="Agregar" />}
          verde
        />
      </div>

      {/* Activos */}
      <div className="mt-4 rounded-2xl border border-noema-deep/10 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="size-5 text-noema-sage" strokeWidth={1.7} />
            <h2 className="font-serif text-lg text-ink">Activos del negocio</h2>
          </div>
          <AgregarActivo />
        </div>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="font-serif text-2xl text-ink">{mxnExacto(totalActivos)}</span>
          <span className="text-sm text-foreground-muted">valor total</span>
        </div>
        {activosList.length === 0 ? (
          <p className="py-4 text-sm text-foreground-muted">
            Registra tu equipo, mobiliario y tecnología para conocer el valor de tu consultorio.
          </p>
        ) : (
          <div className="divide-y divide-noema-deep/[0.06]">
            {activosList.map((a) => (
              <FilaActivo key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>

      {/* Configuración fiscal + por cobrar */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-6">
          <div className="mb-2 flex items-center gap-2">
            <Landmark className="size-5 text-noema-sage" strokeWidth={1.7} />
            <h2 className="font-serif text-lg text-ink">Tasa de impuestos estimada</h2>
          </div>
          <p className="mb-3 text-sm text-foreground-muted">
            % aproximado que apartas de tus ingresos para impuestos. Sirve para estimar tu carga
            fiscal del mes (no sustituye asesoría contable).
          </p>
          <EditorTasaImpuesto tasaInicial={tasaImpuesto} />
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-6">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="size-5 text-amber-600" strokeWidth={1.7} />
            <h2 className="font-serif text-lg text-ink">Por cobrar</h2>
          </div>
          <p className="mb-3 font-serif text-2xl text-ink">{mxnExacto(totalPendiente)}</p>
          {pendientes.length === 0 ? (
            <p className="text-sm text-foreground-muted">No tienes pagos pendientes. 🎉</p>
          ) : (
            <div className="space-y-2">
              {pendientes.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {p.vinculacion_id ? nombrePorVinc.get(p.vinculacion_id) ?? 'Paciente' : 'General'}
                    <span className="text-foreground-muted"> · {formatFecha(p.fecha)}</span>
                  </span>
                  <span className="font-medium text-ink">{mxnExacto(Number(p.monto))}</span>
                  <MarcarPagado pagoId={p.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Metrica({
  icono,
  label,
  valor,
  extra,
  tono = 'neutral',
}: {
  icono: React.ReactNode;
  label: string;
  valor: string;
  extra?: React.ReactNode;
  tono?: 'verde' | 'clay' | 'neutral';
}) {
  const color = tono === 'verde' ? 'text-noema-sage' : tono === 'clay' ? 'text-noema-clay' : 'text-noema-deep/60';
  return (
    <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <div className={`mb-2 flex items-center justify-between ${color}`}>
        <span className="flex size-8 items-center justify-center rounded-lg bg-noema-sage/10">{icono}</span>
        {extra}
      </div>
      <p className="font-serif text-2xl text-ink">{valor}</p>
      <p className="caption mt-1">{label}</p>
    </div>
  );
}

function SeccionMovs({
  titulo,
  descripcion,
  total,
  movs,
  agregar,
  verde,
}: {
  titulo: string;
  descripcion: string;
  total: number;
  movs: Movimiento[];
  agregar: React.ReactNode;
  verde?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-noema-deep/10 bg-white p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink">{titulo}</h2>
        {agregar}
      </div>
      <p className="mb-3 text-xs text-foreground-muted">{descripcion}</p>
      <p className={`mb-3 font-serif text-2xl ${verde ? 'text-noema-sage' : 'text-ink'}`}>{mxnExacto(total)}</p>
      {movs.length === 0 ? (
        <p className="text-sm text-foreground-muted">Nada registrado aún.</p>
      ) : (
        <div className="max-h-64 divide-y divide-noema-deep/[0.06] overflow-y-auto">
          {movs.map((mm) => (
            <FilaMovimiento key={mm.id} m={mm} />
          ))}
        </div>
      )}
    </div>
  );
}

function Ley({ color, label, n }: { color: string; label: string; n: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 text-ink/80">{label}</span>
      <span className="font-medium text-ink">{n}</span>
    </li>
  );
}
