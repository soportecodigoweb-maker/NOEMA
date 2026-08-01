import { redirect } from 'next/navigation';
import { Users, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cargarTerapeutasYPacientes } from './data';
import { PacientesDelCentro } from '@/components/centro/PacientesDelCentro';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Centro terapéutico' };

export default async function CentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [{ data: centro }, terapeutas] = await Promise.all([
    supabase
      .from('centros')
      .select('nombre_centro, codigo_centro, ciudad')
      .eq('profile_id', user.id)
      .maybeSingle(),
    cargarTerapeutasYPacientes(user.id),
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

      {/* Terapeutas del centro y sus pacientes */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
          <Users className="size-5 text-noema-sage" /> Terapeutas y pacientes
        </h2>
        <p className="mb-4 text-sm text-foreground-muted">
          Ves qué pacientes atiende cada terapeuta (no su contenido). Cuando un terapeuta se va,
          reasigna a sus pacientes con otro del centro para dar continuidad.
        </p>
        <PacientesDelCentro terapeutas={terapeutas} />
      </section>
    </div>
  );
}
