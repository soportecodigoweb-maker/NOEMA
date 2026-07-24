'use client';

import { useState, useTransition } from 'react';
import { Plus, X, Trash2, Percent } from 'lucide-react';
import {
  agregarMovimientoAction,
  eliminarMovimientoAction,
  agregarActivoAction,
  eliminarActivoAction,
  guardarTasaImpuestoAction,
} from '../../../app/(panel)/finanzas/actions';

function mxn(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export interface Movimiento {
  id: string;
  tipo: string;
  categoria: string | null;
  concepto: string;
  monto: number;
  fecha: string;
  recurrente: boolean;
}
export interface Activo {
  id: string;
  nombre: string;
  categoria: string | null;
  valor: number;
  fecha_adquisicion: string | null;
}

const TIPO_LABEL: Record<string, string> = {
  gasto_fijo: 'Gasto fijo',
  gasto_variable: 'Gasto variable',
  impuesto: 'Impuesto',
  ingreso_otro: 'Otro ingreso',
};

// ── Botón + modal para agregar un movimiento de un tipo dado ────────────────
export function AgregarMovimiento({
  tipo,
  etiqueta,
  categorias = [],
}: {
  tipo: 'gasto_fijo' | 'gasto_variable' | 'impuesto' | 'ingreso_otro';
  etiqueta: string;
  categorias?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (fd: FormData) => {
    setError(null);
    fd.set('tipo', tipo);
    startTransition(async () => {
      const r = await agregarMovimientoAction(fd);
      if (r.ok) setOpen(false);
      else setError(r.error ?? 'Error');
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-noema-deep/15 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-noema-sage"
      >
        <Plus className="size-4" strokeWidth={2} />
        {etiqueta}
      </button>

      {open && (
        <Modal titulo={etiqueta} onClose={() => setOpen(false)}>
          <form action={onSubmit} className="space-y-3">
            <Campo label="Concepto">
              <input name="concepto" required placeholder="Ej. Renta del consultorio" className={inputCls} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Monto (MXN)">
                <input name="monto" type="number" min="0" step="0.01" required placeholder="0.00" className={inputCls} />
              </Campo>
              <Campo label="Fecha">
                <input name="fecha" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </Campo>
            </div>
            {categorias.length > 0 && (
              <Campo label="Categoría">
                <input name="categoria" list="cats" placeholder="Ej. servicios" className={inputCls} />
                <datalist id="cats">
                  {categorias.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Campo>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={pending} className={btnCls}>
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

// ── Botón + modal para agregar un activo ────────────────────────────────────
export function AgregarActivo() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (fd: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await agregarActivoAction(fd);
      if (r.ok) setOpen(false);
      else setError(r.error ?? 'Error');
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-noema-deep/15 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-noema-sage"
      >
        <Plus className="size-4" strokeWidth={2} />
        Agregar activo
      </button>

      {open && (
        <Modal titulo="Nuevo activo" onClose={() => setOpen(false)}>
          <form action={onSubmit} className="space-y-3">
            <Campo label="Nombre del activo">
              <input name="nombre" required placeholder="Ej. Laptop, sillón, proyector" className={inputCls} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Valor (MXN)">
                <input name="valor" type="number" min="0" step="0.01" required placeholder="0.00" className={inputCls} />
              </Campo>
              <Campo label="Categoría">
                <select name="categoria" className={inputCls} defaultValue="equipo">
                  <option value="equipo">Equipo</option>
                  <option value="mobiliario">Mobiliario</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="otro">Otro</option>
                </select>
              </Campo>
            </div>
            <Campo label="Fecha de adquisición (opcional)">
              <input name="fecha_adquisicion" type="date" className={inputCls} />
            </Campo>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={pending} className={btnCls}>
              {pending ? 'Guardando…' : 'Guardar activo'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

// ── Fila con botón de eliminar (movimiento) ─────────────────────────────────
export function FilaMovimiento({ m }: { m: Movimiento }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{m.concepto}</p>
        <p className="text-xs text-foreground-muted">
          {m.categoria ? `${m.categoria} · ` : ''}
          {new Date(m.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' })}
          {m.recurrente ? ' · mensual' : ''}
        </p>
      </div>
      <span className="shrink-0 font-medium text-ink">{mxn(Number(m.monto))}</span>
      <button
        onClick={() => startTransition(async () => { await eliminarMovimientoAction(m.id); })}
        disabled={pending}
        aria-label="Eliminar"
        className="shrink-0 text-foreground-muted hover:text-noema-clay disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function FilaActivo({ a }: { a: Activo }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{a.nombre}</p>
        <p className="text-xs capitalize text-foreground-muted">{a.categoria ?? 'activo'}</p>
      </div>
      <span className="shrink-0 font-medium text-ink">{mxn(Number(a.valor))}</span>
      <button
        onClick={() => startTransition(async () => { await eliminarActivoAction(a.id); })}
        disabled={pending}
        aria-label="Eliminar"
        className="shrink-0 text-foreground-muted hover:text-noema-clay disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

// ── Editor de tasa de impuestos ─────────────────────────────────────────────
export function EditorTasaImpuesto({ tasaInicial }: { tasaInicial: number }) {
  const [tasa, setTasa] = useState(String(tasaInicial));
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const guardar = () => {
    startTransition(async () => {
      await guardarTasaImpuestoAction(Number(tasa) || 0);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={tasa}
          onChange={(e) => setTasa(e.target.value)}
          className="w-20 rounded-md border border-noema-deep/15 bg-white px-2.5 py-1.5 pr-7 text-sm focus:border-noema-sage focus:outline-none"
        />
        <Percent className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-foreground-muted" />
      </div>
      <button
        onClick={guardar}
        disabled={pending}
        className="rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
      >
        {pending ? '…' : 'Guardar'}
      </button>
      {ok && <span className="text-sm text-emerald-600">✓</span>}
    </div>
  );
}

export { TIPO_LABEL };

// ── UI compartida ───────────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';
const btnCls =
  'w-full rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50';

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-ink/80">{label}</label>
      {children}
    </div>
  );
}

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-noema-deep/40 p-4">
      <div className="my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">{titulo}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
