import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Target, CheckCircle2, Circle, Sun } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Meta {
  id: string;
  titulo: string;
  tipo: string;
  recurrencia: string | null;
  completado: boolean;
  completado_at: string | null;
  creado_at: string;
}

const GRUPOS: { tipo: string; label: string; icon: typeof Target }[] = [
  { tipo: 'diario', label: 'Objetivos del día', icon: Sun },
  { tipo: 'corto', label: 'Corto plazo', icon: Target },
  { tipo: 'mediano', label: 'Mediano plazo', icon: Target },
  { tipo: 'largo', label: 'Largo plazo', icon: Target },
];

export default async function MetasPacientePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('paciente_id')
    .eq('id', id)
    .single();

  if (!vinc?.paciente_id) {
    return (
      <Card variant="flat" className="py-12 text-center">
        <p className="text-foreground-muted">Aún no hay paciente vinculado.</p>
      </Card>
    );
  }

  // RLS solo deja ver las metas que el paciente compartió con su terapeuta.
  const { data: metas } = await supabase
    .from('recordatorios_personales')
    .select('id, titulo, tipo, recurrencia, completado, completado_at, creado_at')
    .eq('paciente_id', vinc.paciente_id)
    .eq('compartida', true)
    .order('creado_at', { ascending: false });

  const lista = (metas as Meta[] | null) ?? [];
  const total = lista.length;
  const cumplidas = lista.filter((m) => m.completado).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 flex items-center gap-2 font-serif text-2xl text-ink">
          <Target className="size-6 text-noema-sage" /> Metas del paciente
        </h2>
        <p className="text-sm text-foreground-muted">
          Las metas que tu paciente decidió compartir contigo, y cuáles ha cumplido.
        </p>
      </div>

      {total === 0 ? (
        <Card variant="flat" className="py-12 text-center">
          <p className="text-foreground-muted">
            Tu paciente aún no ha compartido metas contigo. Puede compartirlas desde «Mis metas».
          </p>
        </Card>
      ) : (
        <>
          {/* Resumen de avance */}
          <Card variant="flat">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
                <span className="font-serif text-lg text-noema-deep">
                  {Math.round((cumplidas / total) * 100)}%
                </span>
              </div>
              <div>
                <p className="font-medium text-ink">
                  {cumplidas} de {total} cumplidas
                </p>
                <p className="text-sm text-foreground-muted">Avance en sus metas compartidas</p>
              </div>
            </div>
          </Card>

          {/* Metas por plazo */}
          {GRUPOS.map((g) => {
            const delGrupo = lista.filter((m) => m.tipo === g.tipo);
            if (delGrupo.length === 0) return null;
            return (
              <section key={g.tipo}>
                <h3 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-muted">
                  <g.icon className="size-3.5" /> {g.label} ({delGrupo.length})
                </h3>
                <ul className="space-y-2">
                  {delGrupo.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-start gap-3 rounded-xl border border-noema-deep/10 bg-white px-4 py-3"
                    >
                      {m.completado ? (
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-noema-sage" />
                      ) : (
                        <Circle className="mt-0.5 size-5 shrink-0 text-ink/25" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${m.completado ? 'text-ink/50 line-through' : 'text-ink'}`}>
                          {m.titulo}
                        </p>
                        {m.completado && m.completado_at && (
                          <p className="text-xs text-noema-sage">
                            Cumplida el{' '}
                            {new Date(m.completado_at).toLocaleDateString('es-MX', {
                              day: 'numeric',
                              month: 'long',
                              timeZone: 'America/Mexico_City',
                            })}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
