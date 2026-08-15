import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { listaTerapeutasCentro } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Terapeutas · Centro' };

export default async function TerapeutasCentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const terapeutas = await listaTerapeutasCentro(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Users className="size-7 text-noema-sage" /> Terapeutas
        </h1>
        <p className="text-sm text-foreground-muted">
          Toca un terapeuta para ver sus pacientes y darles continuidad.
        </p>
      </div>

      {terapeutas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
          Aún no hay terapeutas vinculados. Comparte el código de tu centro para que se unan.
        </p>
      ) : (
        <ul className="space-y-2">
          {terapeutas.map((t) => (
            <li key={t.terapeutaId}>
              <Link
                href={`/centro/terapeutas/${t.terapeutaId}`}
                className="flex items-center gap-4 rounded-2xl border border-noema-deep/10 bg-white p-4 transition-colors hover:border-noema-sage/40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15 text-sm font-medium text-noema-deep/70">
                  {t.nombre
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() ?? '')
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{t.nombre}</p>
                  <p className="text-xs text-foreground-muted">
                    {t.pacientes} paciente{t.pacientes === 1 ? '' : 's'} activo{t.pacientes === 1 ? '' : 's'}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-foreground-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
