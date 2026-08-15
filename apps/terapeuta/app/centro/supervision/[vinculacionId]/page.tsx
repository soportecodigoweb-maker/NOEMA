import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, NotebookPen, ClipboardList, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { procesoSupervision } from '../../data';
import { RegistrarAccesoSupervision } from '@/components/centro/RegistrarAccesoSupervision';
import { ComentarPractica } from '@/components/centro/ComentarPractica';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ vinculacionId: string }>;
}

export default async function SupervisionDetallePage({ params }: PageProps) {
  const { vinculacionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const p = await procesoSupervision(user.id, vinculacionId);
  if (p === null) notFound();

  const volver = (
    <Link href="/centro/supervision" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink">
      <ChevronLeft className="size-4" /> Supervisión
    </Link>
  );

  if (!p.permitido) {
    return (
      <div className="space-y-6">
        {volver}
        <div className="flex items-start gap-3 rounded-2xl border border-noema-clay/25 bg-noema-clay/[0.04] p-6">
          <Lock className="mt-0.5 size-5 shrink-0 text-noema-clay" />
          <div>
            <p className="font-medium text-ink">Acceso no autorizado</p>
            <p className="mt-1 text-sm text-foreground-muted">
              {p.terapeutaNombre} aún no autoriza la supervisión de sus pacientes. Actívala en Inicio
              para que reciba la solicitud.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {volver}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-ink">{p.pacienteNombre}</h1>
          <p className="text-sm text-foreground-muted">Terapeuta: {p.terapeutaNombre}</p>
        </div>
        <RegistrarAccesoSupervision vinculacionId={vinculacionId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Registros (90 días)</p>
          <p className="mt-1 font-serif text-3xl text-ink">{p.registros.total}</p>
          <p className="mt-1 text-xs text-foreground-muted">
            Intensidad prom. {p.registros.promedio ?? '—'}/5
          </p>
        </div>
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Tareas</p>
          <p className="mt-1 font-serif text-3xl text-ink">
            {p.tareas.completadas}<span className="text-lg text-foreground-muted">/{p.tareas.total}</span>
          </p>
          <p className="mt-1 text-xs text-foreground-muted">completadas</p>
        </div>
        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">Objetivos</p>
          <p className="mt-1 font-serif text-3xl text-ink">{p.notas.objetivos.length}</p>
          <p className="mt-1 text-xs text-foreground-muted">trabajados</p>
        </div>
      </div>

      {/* Emociones */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h2 className="mb-2 flex items-center gap-2 font-serif text-lg text-ink">
          <NotebookPen className="size-5 text-noema-sage" /> Emociones y registros
        </h2>
        <p className="text-sm text-ink/80">Predominantes: {p.registros.top}</p>
        {p.registros.recientes.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-ink/70">
            {p.registros.recientes.map((x, i) => (
              <li key={i} className="border-l-2 border-noema-sage/30 pl-3">{x}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Objetivos y plan */}
      {(p.notas.objetivos.length > 0 || p.notas.plan || p.notas.observaciones.length > 0) && (
        <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg text-ink">
            <Target className="size-5 text-noema-sage" /> Proceso terapéutico
          </h2>
          {p.notas.objetivos.length > 0 && (
            <p className="text-sm text-ink/80">
              <span className="font-medium">Objetivos:</span> {p.notas.objetivos.join(', ')}
            </p>
          )}
          {p.notas.observaciones.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-ink/70">
              {p.notas.observaciones.map((o, i) => (
                <li key={i} className="border-l-2 border-noema-sage/30 pl-3">{o}</li>
              ))}
            </ul>
          )}
          {p.notas.plan && (
            <p className="mt-2 text-sm text-ink/80">
              <span className="font-medium">Plan:</span> {p.notas.plan}
            </p>
          )}
        </section>
      )}

      {/* Tareas */}
      {p.tareas.titulos.length > 0 && (
        <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg text-ink">
            <ClipboardList className="size-5 text-noema-sage" /> Tareas asignadas
          </h2>
          <ul className="space-y-1 text-sm text-ink/70">
            {p.tareas.titulos.map((t, i) => (
              <li key={i}>· {t}</li>
            ))}
          </ul>
        </section>
      )}

      <ComentarPractica terapeutaId={p.terapeutaId} />
    </div>
  );
}
