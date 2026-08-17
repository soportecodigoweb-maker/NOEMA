'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import {
  guardarConfigFinancieraAction,
  guardarTarifaTerapeutaAction,
  registrarCobroAction,
  eliminarCobroAction,
} from '../../../app/centro/finanzas-actions';

interface Fila {
  terapeutaId: string;
  nombre: string;
  sesiones: number;
  tarifa: number;
  esperado: number;
  cobrado: number;
  diferencia: number;
  comisionPct: number;
  paraCentro: number;
  paraTerapeuta: number;
}

interface Cobro {
  id: string;
  fecha: string;
  monto: number;
  metodo: string;
  concepto: string | null;
  terapeuta: string;
}

const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function ConfigFinanciera({
  tarifa: t0,
  comision: c0,
  moneda,
}: {
  tarifa: number;
  comision: number;
  moneda: string;
}) {
  const [tarifa, setTarifa] = useState(String(t0));
  const [comision, setComision] = useState(String(c0));
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const guardar = () => {
    startTransition(async () => {
      const r = await guardarConfigFinancieraAction(Number(tarifa), Number(comision));
      if (r.ok) {
        setOk(true);
        setTimeout(() => setOk(false), 2500);
        router.refresh();
      }
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
        <Settings2 className="size-5 text-noema-sage" /> Configuración
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-0.5 block text-xs text-foreground-muted">Tarifa por sesión ({moneda})</span>
          <input className={input} type="number" min="0" value={tarifa} onChange={(e) => setTarifa(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-xs text-foreground-muted">Comisión del centro (%)</span>
          <input className={input} type="number" min="0" max="100" value={comision} onChange={(e) => setComision(e.target.value)} />
        </label>
        <div className="flex items-end gap-2">
          <button
            onClick={guardar}
            disabled={pending}
            className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
          {ok && <span className="inline-flex items-center gap-1 text-sm text-noema-sage"><Check className="size-4" /> Listo</span>}
        </div>
      </div>
      <p className="mt-2 text-xs text-foreground-muted">
        Se usa para calcular lo esperado. Puedes ajustar tarifa y comisión por terapeuta en la tabla.
      </p>
    </section>
  );
}

export function TablaTerapeutas({ filas, moneda }: { filas: Fila[]; moneda: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [tarifa, setTarifa] = useState('');
  const [comision, setComision] = useState('');
  const [, startTransition] = useTransition();

  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const guardar = (id: string) => {
    startTransition(async () => {
      await guardarTarifaTerapeutaAction(
        id,
        tarifa === '' ? null : Number(tarifa),
        comision === '' ? null : Number(comision),
      );
      setEditando(null);
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-noema-deep/10 bg-white">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-noema-deep/[0.08] text-left text-xs uppercase tracking-wider text-foreground-muted">
            <th className="px-4 py-3 font-medium">Terapeuta</th>
            <th className="px-4 py-3 font-medium">Sesiones</th>
            <th className="px-4 py-3 font-medium">Tarifa</th>
            <th className="px-4 py-3 font-medium">Esperado</th>
            <th className="px-4 py-3 font-medium">Cobrado</th>
            <th className="px-4 py-3 font-medium">Diferencia</th>
            <th className="px-4 py-3 font-medium">Centro / Terapeuta</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-foreground-muted">
                Sin terapeutas activos.
              </td>
            </tr>
          ) : (
            filas.map((f) => (
              <tr key={f.terapeutaId} className="border-b border-noema-deep/[0.04] last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{f.nombre}</td>
                <td className="px-4 py-3 text-foreground-muted">{f.sesiones}</td>
                <td className="px-4 py-3">
                  {editando === f.terapeutaId ? (
                    <div className="flex gap-1">
                      <input
                        className="w-20 rounded border border-noema-deep/15 px-2 py-1 text-xs"
                        placeholder="tarifa"
                        value={tarifa}
                        onChange={(e) => setTarifa(e.target.value)}
                      />
                      <input
                        className="w-16 rounded border border-noema-deep/15 px-2 py-1 text-xs"
                        placeholder="% "
                        value={comision}
                        onChange={(e) => setComision(e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="text-foreground-muted">{fmt(f.tarifa)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground-muted">{fmt(f.esperado)}</td>
                <td className="px-4 py-3 font-medium text-ink">{fmt(f.cobrado)}</td>
                <td className="px-4 py-3">
                  {Math.abs(f.diferencia) < 0.01 ? (
                    <span className="inline-flex items-center gap-1 text-noema-sage">
                      <Check className="size-3.5" /> Cuadra
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 ${f.diferencia < 0 ? 'text-[#B85450]' : 'text-noema-clay'}`}
                    >
                      <AlertTriangle className="size-3.5" /> {fmt(f.diferencia)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-foreground-muted">
                  {fmt(f.paraCentro)} / {fmt(f.paraTerapeuta)}
                  <span className="ml-1 opacity-60">({f.comisionPct}%)</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {editando === f.terapeutaId ? (
                    <div className="flex justify-end gap-1">
                      <button onClick={() => guardar(f.terapeutaId)} className="rounded bg-noema-deep px-2 py-1 text-xs text-bone">
                        Guardar
                      </button>
                      <button onClick={() => setEditando(null)} className="px-2 py-1 text-xs text-foreground-muted">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditando(f.terapeutaId);
                        setTarifa(String(f.tarifa));
                        setComision(String(f.comisionPct));
                      }}
                      className="text-xs text-noema-sage hover:underline"
                    >
                      Ajustar
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function RegistrarCobro({ terapeutas }: { terapeutas: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [terapeutaId, setTerapeutaId] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('efectivo');
  const [concepto, setConcepto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const registrar = () => {
    setError(null);
    startTransition(async () => {
      const r = await registrarCobroAction(terapeutaId, Number(monto), metodo, concepto, fecha);
      if (r.ok) {
        setOk(true);
        setMonto('');
        setConcepto('');
        setTimeout(() => setOk(false), 2500);
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo registrar.');
      }
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
        <Plus className="size-5 text-noema-sage" /> Registrar cobro (recepción)
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <select className={input} value={terapeutaId} onChange={(e) => setTerapeutaId(e.target.value)}>
          <option value="">Terapeuta…</option>
          {terapeutas.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <input className={input} type="number" min="0" placeholder="Monto" value={monto} onChange={(e) => setMonto(e.target.value)} />
        <select className={input} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </select>
        <input className={input} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <input className={input} placeholder="Concepto (opcional)" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={registrar}
          disabled={pending || !monto}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Registrando…' : 'Registrar cobro'}
        </button>
        {ok && <span className="inline-flex items-center gap-1 text-sm text-noema-sage"><Check className="size-4" /> Registrado</span>}
      </div>
    </section>
  );
}

export function ListaCobros({ cobros }: { cobros: Cobro[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const borrar = (id: string) => {
    startTransition(async () => {
      await eliminarCobroAction(id);
      router.refresh();
    });
  };

  if (cobros.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-6 text-sm text-foreground-muted">
        No hay cobros registrados este mes.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-noema-deep/[0.06] rounded-2xl border border-noema-deep/10 bg-white">
      {cobros.map((c) => (
        <li key={c.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <span className="w-24 shrink-0 text-xs text-foreground-muted">{c.fecha}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ink">{c.terapeuta}</span>
            {c.concepto && <span className="block truncate text-xs text-foreground-muted">{c.concepto}</span>}
          </span>
          <span className="shrink-0 rounded bg-noema-deep/[0.06] px-2 py-0.5 text-[11px] text-ink/70">{c.metodo}</span>
          <span className="w-24 shrink-0 text-right font-medium text-ink">{fmt(c.monto)}</span>
          <button onClick={() => borrar(c.id)} aria-label="Eliminar" className="shrink-0 text-ink/30 hover:text-red-600">
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
