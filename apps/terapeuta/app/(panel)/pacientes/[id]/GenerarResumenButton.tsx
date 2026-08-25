'use client';

import { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Activity,
  Bookmark,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { History, ArrowLeft, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sparkline, Dona, Anillo, Tendencia } from '@/components/charts/Charts';
import { formatFecha, formatHora } from '@/lib/utils';
import {
  generarResumenAction,
  listarResumenesAction,
  obtenerResumenAction,
  type ResumenData,
  type ResumenGuardado,
} from './resumen-actions';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const haceDias = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export function GenerarResumenButton({ vinculacionId }: { vinculacionId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResumenData | null>(null);
  const [vista, setVista] = useState<'resumen' | 'historial'>('resumen');
  const [historial, setHistorial] = useState<ResumenGuardado[]>([]);
  const [fase, setFase] = useState<'config' | 'ver'>('config');
  const [desde, setDesde] = useState<string>(() => haceDias(6));
  const [hasta, setHasta] = useState<string>(() => hoyISO());

  const cargarHistorial = async () => {
    setHistorial(await listarResumenesAction(vinculacionId));
  };

  const generar = async () => {
    setLoading(true);
    setData(null);
    setVista('resumen');
    setFase('ver');
    try {
      setData(await generarResumenAction(vinculacionId, desde, hasta));
      cargarHistorial();
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const verGuardado = async (id: string) => {
    setLoading(true);
    setVista('resumen');
    try {
      const d = await obtenerResumenAction(id);
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="md"
        onClick={() => {
          setOpen(true);
          setFase('config');
          setData(null);
        }}
      >
        <Sparkles className="size-4" strokeWidth={1.8} />
        Resumen pre-sesión
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-noema-deep/50 p-4">
      <div className="my-6 w-full max-w-3xl rounded-2xl bg-white text-ink shadow-xl [color-scheme:light]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-noema-deep/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-noema-sage" strokeWidth={1.8} />
            <h2 className="font-serif text-2xl text-ink">Resumen pre-sesión</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (vista === 'historial') {
                  setVista('resumen');
                } else {
                  cargarHistorial();
                  setVista('historial');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-noema-sage hover:bg-noema-sage/10"
            >
              {vista === 'historial' ? <ArrowLeft className="size-4" /> : <History className="size-4" />}
              {vista === 'historial' ? 'Volver' : 'Historial'}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setData(null);
                setVista('resumen');
              }}
              className="text-foreground-muted hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
          {vista === 'historial' ? (
            historial.length === 0 ? (
              <p className="py-10 text-center text-sm text-foreground-muted">
                Aún no hay resúmenes guardados. Cada resumen que generes queda aquí.
              </p>
            ) : (
              <ul className="space-y-2">
                {historial.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => verGuardado(h.id)}
                      className="w-full rounded-xl border border-noema-deep/10 bg-white px-4 py-3 text-left transition-colors hover:border-noema-sage"
                    >
                      <p className="text-sm font-medium text-ink">
                        {formatFecha(h.generado_at)} · {formatHora(h.generado_at)}
                      </p>
                      {h.narrativa && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink/70">{h.narrativa}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : fase === 'config' ? (
            <SelectorFechas
              desde={desde}
              hasta={hasta}
              setDesde={setDesde}
              setHasta={setHasta}
              onGenerar={generar}
            />
          ) : (
          <>
          {loading && (
            <div className="space-y-3 py-16 text-center">
              <Loader2 className="mx-auto size-8 animate-spin text-noema-sage" />
              <p className="text-sm text-foreground-muted">
                Analizando lo que {`${vinculacionId ? 'tu paciente' : ''}`} compartió…
              </p>
            </div>
          )}

          {data && !data.ok && (
            <div className="space-y-3 py-8 text-center">
              <p className="text-noema-clay">{data.error ?? 'No se pudo generar el resumen.'}</p>
              <Button variant="secondary" size="sm" onClick={() => setFase('config')}>
                Elegir otras fechas
              </Button>
            </div>
          )}

          {data?.ok && !loading && (
            <>
              <button
                onClick={() => setFase('config')}
                className="mb-3 inline-flex items-center gap-1.5 text-xs text-noema-sage hover:underline"
              >
                <ArrowLeft className="size-3.5" /> Cambiar fechas
              </button>
              <Contenido data={data} />
            </>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectorFechas({
  desde,
  hasta,
  setDesde,
  setHasta,
  onGenerar,
}: {
  desde: string;
  hasta: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  onGenerar: () => void;
}) {
  const hoy = hoyISO();
  const presets = [
    { label: 'Hoy', d: haceDias(0), h: haceDias(0) },
    { label: 'Últimos 7 días', d: haceDias(6), h: hoy },
    { label: 'Últimos 14 días', d: haceDias(13), h: hoy },
    { label: 'Últimos 30 días', d: haceDias(29), h: hoy },
  ];
  const unDia = desde === hasta;
  return (
    <div className="space-y-5 py-4">
      <div className="flex items-start gap-2">
        <CalendarDays className="mt-0.5 size-5 shrink-0 text-noema-sage" strokeWidth={1.8} />
        <div>
          <p className="text-sm font-medium text-ink">¿Qué periodo quieres analizar?</p>
          <p className="text-xs text-foreground-muted">
            Por defecto, los últimos 7 días. Puedes elegir un rango o un solo día.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const activo = p.d === desde && p.h === hasta;
          return (
            <button
              key={p.label}
              onClick={() => {
                setDesde(p.d);
                setHasta(p.h);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                activo
                  ? 'border-noema-sage bg-noema-sage/10 text-noema-sage'
                  : 'border-noema-deep/15 text-ink/70 hover:border-noema-sage/50'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-foreground-muted">Desde</span>
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-foreground-muted">Hasta</span>
          <input
            type="date"
            value={hasta}
            min={desde}
            max={hoy}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
          />
        </label>
      </div>

      <p className="text-xs text-foreground-muted">
        {unDia ? 'Analizarás un solo día.' : 'Analizarás el rango seleccionado.'}
      </p>

      <Button variant="primary" size="lg" fullWidth onClick={onGenerar}>
        <Sparkles className="size-4" strokeWidth={1.8} />
        Generar análisis
      </Button>
    </div>
  );
}

function rangoTexto(data: ResumenData): string {
  if (data.desde && data.hasta) {
    if (data.desde === data.hasta) return `el ${formatFecha(data.desde)}`;
    return `del ${formatFecha(data.desde)} al ${formatFecha(data.hasta)}`;
  }
  return `últimos ${data.dias} días`;
}

function Contenido({ data }: { data: ResumenData }) {
  const m = data.metricas;
  const sinDatos = m.registros === 0 && m.diario === 0 && m.tareasTotal === 0;

  if (sinDatos) {
    return (
      <p className="py-10 text-center text-sm text-foreground-muted">
        {data.nombre} no compartió registros ni marcó contenido en {rangoTexto(data)}.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="caption">
        {data.nombre} · {rangoTexto(data)}
      </p>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metrica
          icono={<Activity className="size-4" />}
          valor={String(m.registros)}
          label="Registros"
        />
        <Metrica
          icono={<TrendingUp className="size-4" />}
          valor={m.intensidadProm !== null ? `${m.intensidadProm}/5` : '—'}
          label="Intensidad media"
          extra={<Tendencia delta={m.deltaIntensidad} />}
        />
        <Metrica
          icono={<Bookmark className="size-4" />}
          valor={String(m.marcados)}
          label="Marcados p/ sesión"
        />
        <Metrica
          icono={<ClipboardCheck className="size-4" />}
          valor={m.adherenciaPct !== null ? `${m.adherenciaPct}%` : '—'}
          label={`Adherencia (${m.tareasCompletadas}/${m.tareasTotal})`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-noema-deep/10 bg-white p-4 sm:col-span-2">
          <p className="caption mb-2">Intensidad emocional en el tiempo</p>
          {data.serie.some((s) => s.intensidad > 0) ? (
            <Sparkline
              data={data.serie.map((s) => s.intensidad)}
              width={440}
              height={70}
              color="#3D4D3E"
              strokeWidth={2}
              fluid
            />
          ) : (
            <p className="py-6 text-center text-xs text-foreground-muted">Sin registros con intensidad.</p>
          )}
        </div>
        <div className="rounded-xl border border-noema-deep/10 bg-white p-4">
          <p className="caption mb-2">Emociones</p>
          {data.distribucion.length > 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Dona
                size={104}
                grosor={15}
                segmentos={data.distribucion}
                centro={<span className="font-serif text-sm text-ink">{m.registros}</span>}
              />
              <ul className="w-full space-y-0.5 text-xs">
                {data.distribucion.slice(0, 4).map((d) => (
                  <li key={d.label} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="flex-1 truncate capitalize text-ink/80">{d.label}</span>
                    <span className="text-foreground-muted">{d.valor}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-foreground-muted">Sin datos.</p>
          )}
        </div>
      </div>

      {/* Síntesis IA */}
      {data.narrativa && (
        <div className="rounded-xl border border-noema-sage/25 bg-gradient-to-br from-noema-sage/[0.06] to-transparent p-5">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-noema-sage">
            <Sparkles className="size-3.5" /> Síntesis del periodo
          </p>
          <div className="space-y-1.5 text-sm leading-relaxed text-ink">
            {data.narrativa.split('\n').filter(Boolean).map((linea, i) =>
              linea.trim().startsWith('-') ? (
                <p key={i} className="flex gap-2 pl-1">
                  <span className="text-noema-sage">•</span>
                  <span>{linea.replace(/^-\s*/, '')}</span>
                </p>
              ) : (
                <p key={i}>{linea}</p>
              ),
            )}
          </div>
          <p className="mt-3 border-t border-noema-deep/[0.06] pt-2 text-[11px] italic text-ink/70">
            Síntesis operativa generada por IA a partir de datos observables. No es diagnóstico ni
            interpretación clínica — esa es tu decisión profesional.
          </p>
        </div>
      )}

      {/* Marcado para sesión */}
      {data.marcadosSesion.length > 0 && (
        <Seccion titulo={`Marcado para hablar en sesión (${data.marcadosSesion.length})`} icono={<Bookmark className="size-4 text-noema-sage" />}>
          <ul className="space-y-2">
            {data.marcadosSesion.map((r, i) => (
              <li key={i} className="rounded-lg border border-noema-deep/[0.06] bg-bone/40 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted">{formatFecha(r.fecha)}</span>
                  <span className="font-medium capitalize text-ink">{r.emocion}</span>
                  <span className="text-xs text-foreground-muted">int. {r.intensidad}/5</span>
                </div>
                {r.detonante && <p className="mt-0.5 text-xs text-ink/90">Detonante: {r.detonante}</p>}
                {r.descripcion && <p className="mt-0.5 text-sm text-ink/80">{r.descripcion}</p>}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* Diario */}
      {data.diarioSesion.length > 0 && (
        <Seccion titulo={`Diario compartido (${data.diarioSesion.length})`} icono={<BookOpen className="size-4 text-noema-sage" />}>
          <ul className="space-y-2">
            {data.diarioSesion.map((d, i) => (
              <li key={i} className="rounded-lg border border-noema-deep/[0.06] bg-bone/40 px-3 py-2">
                <p className="text-xs text-foreground-muted">
                  {formatFecha(d.fecha)}
                  {d.titulo ? ` · ${d.titulo}` : ''}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{d.contenido}</p>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* Tareas */}
      {data.tareas.length > 0 && (
        <Seccion titulo="Tareas" icono={<ClipboardCheck className="size-4 text-noema-sage" />}>
          <div className="flex items-start gap-4">
            {m.adherenciaPct !== null && (
              <Anillo valor={m.tareasCompletadas} total={m.tareasTotal} color="#3D4D3E" size={72} grosor={8} />
            )}
            <ul className="flex-1 space-y-1.5 text-sm">
              {data.tareas.map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-ink">{t.titulo}</span>
                  <span className="text-xs text-foreground-muted">
                    {t.estado}
                    {t.dificultadMedia !== null ? ` · dif. ${t.dificultadMedia}/5` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Seccion>
      )}

      {/* Plan anterior */}
      {data.planPrevio && (
        <Seccion titulo="Plan de la sesión anterior" icono={<Sparkles className="size-4 text-noema-sage" />}>
          <p className="border-l-2 border-noema-sage/40 pl-3 font-serif italic text-ink/80">{data.planPrevio}</p>
        </Seccion>
      )}
    </div>
  );
}

function Metrica({
  icono,
  valor,
  label,
  extra,
}: {
  icono: React.ReactNode;
  valor: string;
  label: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-noema-sage/[0.07] p-3">
      <div className="mb-1 flex items-center justify-between text-noema-sage">
        {icono}
        {extra}
      </div>
      <p className="font-serif text-xl text-ink">{valor}</p>
      <p className="text-[11px] leading-tight text-foreground-muted">{label}</p>
    </div>
  );
}

function Seccion({ titulo, icono, children }: { titulo: string; icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 font-sans text-sm font-semibold text-ink">
        {icono}
        {titulo}
      </h3>
      {children}
    </div>
  );
}
