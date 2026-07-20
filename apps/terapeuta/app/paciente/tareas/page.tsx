import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResponderTarea } from '@/components/paciente/ResponderTarea';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tareas' };

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-400/20 text-amber-700' },
  en_progreso: { label: 'En progreso', color: 'bg-noema-sage/15 text-noema-deep' },
  completada: { label: 'Completada', color: 'bg-emerald-500/15 text-emerald-700' },
  omitida: { label: 'Omitida', color: 'bg-ink/10 text-ink/50' },
};

export default async function TareasPacientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  // Vinculación activa
  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  if (!vinc) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <h1 className="font-serif text-3xl text-ink">Tareas</h1>
        <p className="mt-4 text-ink/60">Aún no tienes un terapeuta vinculado.</p>
      </div>
    );
  }

  const { data: tareas } = await supabase
    .from('tareas')
    .select(`
      id, titulo, descripcion, contenido_md, fecha_limite, estado, campos_respuesta,
      respuestas:tarea_respuestas(id, retroalimentacion, retroalimentacion_at)
    `)
    .eq('vinculacion_id', vinc.id)
    .order('creado_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="font-serif text-3xl text-ink">Tareas</h1>
      <p className="mt-1 text-sm text-ink/60">Lo que tu terapeuta te asignó. Respóndelas a tu ritmo.</p>

      {!tareas || tareas.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          No tienes tareas asignadas por ahora.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {tareas.map((t) => {
            const est = ESTADO_LABEL[t.estado] ?? { label: t.estado, color: 'bg-ink/10 text-ink/50' };
            const feedback = (t.respuestas ?? [])
              .filter((r) => r.retroalimentacion)
              .sort((a, b) => (b.retroalimentacion_at ?? '').localeCompare(a.retroalimentacion_at ?? ''))[0];
            const campos = Array.isArray(t.campos_respuesta) ? (t.campos_respuesta as unknown[]) : [];
            return (
              <li key={t.id} className="rounded-2xl border border-ink/10 bg-white p-5">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${est.color}`}>{est.label}</span>
                  {t.fecha_limite && (
                    <span className="text-xs text-rose-600">
                      Hasta {new Date(t.fecha_limite).toLocaleDateString('es-MX')}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg text-ink">{t.titulo}</h3>
                {t.descripcion && <p className="mt-1 text-sm text-ink/70">{t.descripcion}</p>}
                {t.contenido_md && (
                  <div className="mt-2 rounded-lg bg-paper/50 p-3 text-sm text-ink/70 whitespace-pre-wrap">
                    {t.contenido_md}
                  </div>
                )}

                {feedback?.retroalimentacion && (
                  <div className="mt-3 rounded-lg bg-noema-sage/10 p-3 text-sm">
                    <p className="text-[11px] uppercase tracking-wider text-noema-deep/60">
                      Tu terapeuta comentó
                    </p>
                    <p className="text-ink/80">{feedback.retroalimentacion}</p>
                  </div>
                )}

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <ResponderTarea tareaId={t.id} campos={campos as any} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
