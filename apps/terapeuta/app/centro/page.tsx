import { redirect } from 'next/navigation';
import { Users, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Centro terapéutico' };

export default async function CentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [{ data: centro }, { data: terapeutas }] = await Promise.all([
    supabase
      .from('centros')
      .select('nombre_centro, codigo_centro, ciudad')
      .eq('profile_id', user.id)
      .maybeSingle(),
    supabase
      .from('centro_terapeutas')
      .select('id, terapeuta_nombre, vinculado_at')
      .eq('centro_id', user.id)
      .eq('estado', 'activa')
      .order('vinculado_at', { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">{centro?.nombre_centro ?? 'Tu centro'}</h1>
        {centro?.ciudad && <p className="text-sm text-foreground-muted">{centro.ciudad}</p>}
      </div>

      {/* Código para que los terapeutas se vinculen */}
      <section className="rounded-2xl border border-noema-sage/25 bg-noema-sage/[0.06] p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <KeyRound className="size-4 text-noema-sage" /> Código de tu centro
        </h2>
        <p className="mb-3 text-sm text-foreground-muted">
          Compártelo con tus terapeutas para que se vinculen a este centro desde su panel.
        </p>
        <div className="inline-flex items-center rounded-lg border border-noema-deep/15 bg-white px-4 py-2 font-mono text-lg tracking-wider text-ink">
          {centro?.codigo_centro ?? '—'}
        </div>
      </section>

      {/* Terapeutas del centro */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
          <Users className="size-5 text-noema-sage" /> Terapeutas del centro
          {terapeutas && terapeutas.length > 0 && (
            <span className="text-sm font-normal text-foreground-muted">({terapeutas.length})</span>
          )}
        </h2>
        {!terapeutas || terapeutas.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Aún no hay terapeutas vinculados. Comparte el código de arriba para que se unan.
          </p>
        ) : (
          <ul className="divide-y divide-noema-deep/[0.06]">
            {terapeutas.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-noema-sage/15 text-sm font-medium text-noema-deep/70">
                  {(t.terapeuta_nombre ?? '?')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() ?? '')
                    .join('')}
                </span>
                <span className="text-sm font-medium text-ink">{t.terapeuta_nombre ?? 'Terapeuta'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
