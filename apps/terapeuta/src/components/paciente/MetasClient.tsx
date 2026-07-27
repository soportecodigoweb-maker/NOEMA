'use client';

import { useEffect, useState, useTransition } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Sun, Target } from 'lucide-react';
import { crearMetaAction, toggleMetaAction, eliminarMetaAction } from '../../../app/paciente/actions';

type Tipo = 'diario' | 'corto' | 'mediano' | 'largo';

interface Meta {
  id: string;
  titulo: string;
  tipo: Tipo;
  recurrencia: string | null;
  completado: boolean;
  completado_at: string | null;
}

// getDay(): 0=Domingo … 6=Sábado. (Miércoles = X, para no chocar con Martes = M.)
const LETRA_POR_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const DIAS_PICKER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const NOMBRE_DIA: Record<string, string> = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };
const PLAZOS: Array<{ tipo: Tipo; label: string }> = [
  { tipo: 'corto', label: 'Corto plazo' },
  { tipo: 'mediano', label: 'Mediano plazo' },
  { tipo: 'largo', label: 'Largo plazo' },
];

function esHoy(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function aplicaHoy(m: Meta): boolean {
  if (!m.recurrencia || m.recurrencia === 'diario') return true;
  return m.recurrencia.split(',').includes(LETRA_POR_DIA[new Date().getDay()]!);
}
function etiquetaRecurrencia(rec: string | null): string {
  if (!rec || rec === 'diario') return 'Todos los días';
  return rec.split(',').map((l) => NOMBRE_DIA[l] ?? l).join(' · ');
}

export function MetasClient({ iniciales }: { iniciales: Meta[] }) {
  const [metas, setMetas] = useState<Meta[]>(iniciales);
  const [montado, setMontado] = useState(false);
  const [, startTransition] = useTransition();

  // Evita desajuste de hidratación en la lógica de fechas (servidor vs cliente).
  useEffect(() => setMontado(true), []);

  const [tDiario, setTDiario] = useState('');
  const [dias, setDias] = useState<string[]>([]); // vacío = todos los días
  const [tMeta, setTMeta] = useState('');
  const [plazo, setPlazo] = useState<Tipo>('corto');

  const agregar = (titulo: string, tipo: Tipo, recurrencia: string | null, reset: () => void) => {
    const t = titulo.trim();
    if (!t) return;
    reset();
    const tmpId = crypto.randomUUID();
    setMetas((prev) => [{ id: tmpId, titulo: t, tipo, recurrencia, completado: false, completado_at: null }, ...prev]);
    startTransition(async () => {
      const res = await crearMetaAction(t, tipo, recurrencia);
      if (res.ok && res.id) {
        setMetas((prev) => prev.map((m) => (m.id === tmpId ? { ...m, id: res.id! } : m)));
      } else if (!res.ok) {
        setMetas((prev) => prev.filter((m) => m.id !== tmpId));
      }
    });
  };

  const toggle = (m: Meta, done: boolean) => {
    setMetas((prev) =>
      prev.map((x) =>
        x.id === m.id ? { ...x, completado: done, completado_at: done ? new Date().toISOString() : null } : x,
      ),
    );
    startTransition(() => {
      toggleMetaAction(m.id, done);
    });
  };

  const eliminar = (id: string) => {
    setMetas((prev) => prev.filter((x) => x.id !== id));
    startTransition(() => {
      eliminarMetaAction(id);
    });
  };

  const toggleDia = (l: string) => setDias((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const diarios = metas.filter((m) => m.tipo === 'diario');
  const diariosHoy = diarios.filter(aplicaHoy);
  const diariosOtros = diarios.filter((m) => !aplicaHoy(m));
  const hechosHoy = diariosHoy.filter((m) => esHoy(m.completado_at)).length;

  return (
    <div className="space-y-8">
      {/* ══ Sección A: Objetivos del día ══ */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sun className="size-5 text-noema-sage" strokeWidth={1.9} />
          <h2 className="font-serif text-xl text-ink">Objetivos del día</h2>
        </div>
        <p className="mb-3 text-sm text-ink/60">
          Una lista para marcar día a día. Se reinicia cada mañana.
        </p>

        {/* Alta */}
        <div className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex gap-2">
            <input
              value={tDiario}
              onChange={(e) => setTDiario(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregar(tDiario, 'diario', dias.length ? DIAS_PICKER.filter((d) => dias.includes(d)).join(',') : 'diario', () => { setTDiario(''); setDias([]); })}
              placeholder="Ej. Tomar agua, caminar 10 min…"
              className="flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            />
            <button
              onClick={() => agregar(tDiario, 'diario', dias.length ? DIAS_PICKER.filter((d) => dias.includes(d)).join(',') : 'diario', () => { setTDiario(''); setDias([]); })}
              disabled={!tDiario.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-noema-deep px-3 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
            >
              <Plus className="size-4" /> Agregar
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-ink/50">¿Qué días?</span>
            {DIAS_PICKER.map((l) => {
              const on = dias.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleDia(l)}
                  className={`size-8 rounded-full border text-xs transition-colors ${
                    on ? 'border-noema-sage bg-noema-sage text-bone' : 'border-ink/15 text-ink/60 hover:border-noema-sage'
                  }`}
                >
                  {l}
                </button>
              );
            })}
            <span className="ml-1 text-xs text-ink/40">{dias.length === 0 ? '(todos los días)' : ''}</span>
          </div>
        </div>

        {/* Lista de hoy */}
        {!montado ? (
          <p className="mt-4 text-sm text-ink/40">Cargando…</p>
        ) : (
          <>
            {diariosHoy.length > 0 && (
              <p className="mt-4 text-xs uppercase tracking-wider text-ink/50">
                Hoy · {hechosHoy}/{diariosHoy.length}
              </p>
            )}
            <ul className="mt-2 space-y-2">
              {diariosHoy.length === 0 && (
                <li className="text-sm text-ink/50">No tienes objetivos para hoy. Agrega uno arriba.</li>
              )}
              {diariosHoy.map((m) => {
                const hecho = esHoy(m.completado_at);
                return (
                  <li key={m.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
                    <button onClick={() => toggle(m, !hecho)} aria-label={hecho ? 'Desmarcar' : 'Marcar hecho'} className="shrink-0">
                      {hecho ? <CheckCircle2 className="size-6 text-noema-sage" /> : <Circle className="size-6 text-ink/25" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className={`block text-sm ${hecho ? 'text-ink/40 line-through' : 'text-ink'}`}>{m.titulo}</span>
                      {m.recurrencia && m.recurrencia !== 'diario' && (
                        <span className="text-xs text-ink/45">{etiquetaRecurrencia(m.recurrencia)}</span>
                      )}
                    </div>
                    <button onClick={() => eliminar(m.id)} aria-label="Eliminar" className="shrink-0 text-ink/30 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {diariosOtros.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-ink/40">Programados para otros días</p>
                <ul className="mt-2 space-y-1.5">
                  {diariosOtros.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-lg border border-dashed border-ink/10 px-4 py-2 text-sm text-ink/55">
                      <span className="min-w-0 flex-1 truncate">{m.titulo}</span>
                      <span className="shrink-0 text-xs text-ink/40">{etiquetaRecurrencia(m.recurrencia)}</span>
                      <button onClick={() => eliminar(m.id)} aria-label="Eliminar" className="shrink-0 text-ink/30 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* ══ Sección B: Metas por plazo ══ */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Target className="size-5 text-noema-sage" strokeWidth={1.9} />
          <h2 className="font-serif text-xl text-ink">Mis metas</h2>
        </div>
        <p className="mb-3 text-sm text-ink/60">Objetivos a corto, mediano y largo plazo.</p>

        {/* Alta */}
        <div className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={tMeta}
              onChange={(e) => setTMeta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregar(tMeta, plazo, null, () => setTMeta(''))}
              placeholder="Ej. Retomar el ejercicio, mudarme…"
              className="flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            />
            <select
              value={plazo}
              onChange={(e) => setPlazo(e.target.value as Tipo)}
              className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            >
              {PLAZOS.map((p) => (
                <option key={p.tipo} value={p.tipo}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => agregar(tMeta, plazo, null, () => setTMeta(''))}
              disabled={!tMeta.trim()}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-noema-deep px-3 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
            >
              <Plus className="size-4" /> Agregar
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {PLAZOS.map((p) => {
            const items = metas.filter((m) => m.tipo === p.tipo);
            return (
              <div key={p.tipo}>
                <p className="mb-2 text-xs uppercase tracking-wider text-ink/50">{p.label}</p>
                {items.length === 0 ? (
                  <p className="text-sm text-ink/40">Sin metas a {p.label.toLowerCase()}.</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
                        <button onClick={() => toggle(m, !m.completado)} aria-label={m.completado ? 'Marcar pendiente' : 'Marcar lograda'} className="shrink-0">
                          {m.completado ? <CheckCircle2 className="size-6 text-noema-sage" /> : <Circle className="size-6 text-ink/25" />}
                        </button>
                        <span className={`min-w-0 flex-1 text-sm ${m.completado ? 'text-ink/40 line-through' : 'text-ink'}`}>{m.titulo}</span>
                        <button onClick={() => eliminar(m.id)} aria-label="Eliminar" className="shrink-0 text-ink/30 hover:text-red-600">
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
