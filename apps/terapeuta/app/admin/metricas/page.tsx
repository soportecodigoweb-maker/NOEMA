import { BarChart3 } from 'lucide-react';
import { metricasUso } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Métricas · Panel de dueño' };

export default async function MetricasPage() {
  const uso = await metricasUso();
  const max = Math.max(1, ...uso.map((u) => u.valor));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <BarChart3 className="size-7 text-noema-sage" /> Centro de métricas
        </h1>
        <p className="text-sm text-foreground-muted">
          Qué funciones de NOEMA se usan más (conteos globales, sin contenido de nadie).
        </p>
      </div>

      <div className="rounded-2xl border border-noema-deep/10 bg-white p-6">
        <ul className="space-y-4">
          {uso.map((u) => (
            <li key={u.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink">{u.label}</span>
                <span className="font-medium text-ink">{u.valor.toLocaleString('es-MX')}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-noema-deep/[0.06]">
                <div
                  className="h-full rounded-full bg-noema-sage"
                  style={{ width: `${Math.round((u.valor / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
