import type { ReactNode } from 'react';

/**
 * Kit de gráficos SVG de NOEMA — ligero, sin dependencias, coherente con la
 * marca. Marcas finas, extremos redondeados, ejes discretos. Un color de marca
 * por serie (paleta NOEMA); el texto usa tinta, nunca el color de la serie.
 */

const DEEP = '#2E3B2E';
const SAGE = '#3D4D3E';
const CLAY = '#B85450';

// ── Sparkline de área (tendencia en el tiempo) ──────────────────────────────
export function Sparkline({
  data,
  color = SAGE,
  height = 44,
  width = 140,
  strokeWidth = 2,
  fluid = false,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
  /** Ocupa el 100% del ancho del contenedor (no se sale en móvil). */
  fluid?: boolean;
}) {
  if (data.length < 2) {
    return <div style={{ height }} className="flex items-center text-xs text-foreground-muted">—</div>;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pad = strokeWidth;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1]![0].toFixed(1)},${(height - pad).toFixed(1)} L${pts[0]![0].toFixed(1)},${(height - pad).toFixed(1)} Z`;
  const gid = `spark-${color.replace('#', '')}-${width}-${height}`;

  // fluid: el SVG llena el ancho disponible; con vector-effect el trazo no se
  // distorsiona al escalar. Así la línea nunca se sale del recuadro.
  const dims = fluid
    ? { width: '100%' as const, preserveAspectRatio: 'none' as const, className: 'block max-w-full' }
    : { width, className: 'block max-w-full overflow-visible' };

  return (
    <svg height={height} viewBox={`0 0 ${width} ${height}`} {...dims}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect={fluid ? 'non-scaling-stroke' : undefined}
      />
      {!fluid && (
        <circle cx={pts[pts.length - 1]![0]} cy={pts[pts.length - 1]![1]} r={strokeWidth + 1} fill={color} />
      )}
    </svg>
  );
}

// ── Barras (magnitud por categoría) ─────────────────────────────────────────
export function Barras({
  data,
  color = SAGE,
  height = 120,
  max: maxProp,
}: {
  data: { label: string; valor: number; color?: string }[];
  color?: string;
  height?: number;
  max?: number;
}) {
  const max = maxProp ?? Math.max(...data.map((d) => d.valor), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const hPct = Math.max(2, (d.valor / max) * 100);
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-medium text-ink/70">{d.valor}</span>
            <div
              className="w-full rounded-md transition-all"
              style={{ height: `${hPct}%`, backgroundColor: d.color ?? color, minHeight: 4 }}
              title={`${d.label}: ${d.valor}`}
            />
            <span className="truncate text-[10px] uppercase tracking-wide text-foreground-muted" title={d.label}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Anillo (proporción / avance) ────────────────────────────────────────────
export function Anillo({
  valor,
  total = 100,
  color = SAGE,
  size = 92,
  grosor = 9,
  centro,
}: {
  valor: number;
  total?: number;
  color?: string;
  size?: number;
  grosor?: number;
  centro?: ReactNode;
}) {
  const r = (size - grosor) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, valor / total) : 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={DEEP} strokeOpacity="0.08" strokeWidth={grosor} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centro ?? <span className="font-serif text-lg text-ink">{Math.round(pct * 100)}%</span>}
      </div>
    </div>
  );
}

// ── Donut de segmentos (composición) ────────────────────────────────────────
export function Dona({
  segmentos,
  size = 120,
  grosor = 18,
  centro,
}: {
  segmentos: { label: string; valor: number; color: string }[];
  size?: number;
  grosor?: number;
  centro?: ReactNode;
}) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  const r = (size - grosor) / 2;
  const c = 2 * Math.PI * r;
  let acumulado = 0;
  const gap = 2; // separación entre segmentos (px de circunferencia)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={DEEP} strokeOpacity="0.06" strokeWidth={grosor} />
        {segmentos.map((s, i) => {
          const frac = s.valor / total;
          const len = Math.max(0, frac * c - gap);
          const offset = -acumulado * c;
          acumulado += frac;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={grosor}
              strokeLinecap="butt"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      {centro && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{centro}</div>
      )}
    </div>
  );
}

// ── Indicador de tendencia (▲ ▼ vs periodo anterior) ────────────────────────
export function Tendencia({ delta, sufijo = '%' }: { delta: number | null; sufijo?: string }) {
  if (delta === null || Number.isNaN(delta)) {
    return <span className="text-xs text-foreground-muted">—</span>;
  }
  const positivo = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positivo ? 'text-emerald-600' : 'text-noema-clay'
      }`}
    >
      {positivo ? '▲' : '▼'} {Math.abs(delta)}{sufijo}
    </span>
  );
}

export const CHART_COLORS = { DEEP, SAGE, CLAY };
