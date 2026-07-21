import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Progreso' };

const BIENESTAR = new Set(['tranquilo', 'feliz']);
const MALESTAR = new Set(['ansioso', 'triste', 'cansado']);

interface Fila {
  etiqueta: string;
  bienestar: number;
  malestar: number;
  total: number;
}

export default async function ProgresoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const desde = new Date();
  desde.setDate(desde.getDate() - 60);

  const [{ data: regs }, { data: cat }, { count: totalRegistros }] = await Promise.all([
    supabase
      .from('registros_emocionales')
      .select('emocion_principal_key, situacion_detonante, conducta, intensidad, fecha')
      .eq('paciente_id', user.id)
      .gte('fecha', desde.toISOString().slice(0, 10)),
    supabase.from('emociones_catalogo').select('key, familia'),
    supabase
      .from('registros_emocionales')
      .select('*', { count: 'exact', head: true })
      .eq('paciente_id', user.id),
  ]);

  const familiaPorKey = new Map((cat ?? []).map((c) => [c.key, c.familia]));

  const agrupar = (campo: 'situacion_detonante' | 'conducta'): Fila[] => {
    const mapa = new Map<string, { b: number; m: number }>();
    for (const r of regs ?? []) {
      const etiqueta = (r[campo] ?? '').trim();
      if (!etiqueta) continue;
      const fam = familiaPorKey.get(r.emocion_principal_key) ?? '';
      const cur = mapa.get(etiqueta) ?? { b: 0, m: 0 };
      if (BIENESTAR.has(fam)) cur.b += 1;
      else if (MALESTAR.has(fam)) cur.m += 1;
      mapa.set(etiqueta, cur);
    }
    return [...mapa.entries()]
      .map(([etiqueta, v]) => ({ etiqueta, bienestar: v.b, malestar: v.m, total: v.b + v.m }))
      .filter((f) => f.total >= 2)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  };

  const situaciones = agrupar('situacion_detonante');
  const conductas = agrupar('conducta');
  const intensidadProm =
    (regs ?? []).length > 0
      ? ((regs ?? []).reduce((s, r) => s + r.intensidad, 0) / (regs ?? []).length).toFixed(1)
      : '—';

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Tu progreso</h1>
        <p className="mt-1 text-sm text-ink/60">
          Estos son tus datos, tal cual. Sin interpretaciones — tú decides qué significan.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-noema-sage/8 p-4">
          <p className="text-xs text-ink/50">Registros totales</p>
          <p className="font-serif text-2xl text-ink">{totalRegistros ?? 0}</p>
        </div>
        <div className="rounded-xl bg-noema-sage/8 p-4">
          <p className="text-xs text-ink/50">Intensidad promedio (60d)</p>
          <p className="font-serif text-2xl text-ink">{intensidadProm}/5</p>
        </div>
      </div>

      {situaciones.length === 0 && conductas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          Cuando registres más emociones con su contexto, aquí verás tus patrones.
        </div>
      ) : (
        <div className="space-y-6">
          {situaciones.length > 0 && <BloquePatron titulo="Situaciones que registraste" filas={situaciones} />}
          {conductas.length > 0 && <BloquePatron titulo="Cosas que hiciste" filas={conductas} />}
        </div>
      )}
    </div>
  );
}

function BloquePatron({ titulo, filas }: { titulo: string; filas: Fila[] }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <p className="mb-3 text-xs uppercase tracking-wider text-ink/50">{titulo}</p>
      <div className="space-y-3">
        {filas.map((f) => (
          <div key={f.etiqueta}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink">{f.etiqueta}</span>
              <span className="text-xs text-ink/50">
                {f.bienestar} bienestar · {f.malestar} malestar
              </span>
            </div>
            <div className="mt-1 flex h-1.5 overflow-hidden rounded-full">
              <div className="bg-emerald-400" style={{ flex: Math.max(f.bienestar, 0.001) }} />
              <div className="bg-orange-300" style={{ flex: Math.max(f.malestar, 0.001) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
