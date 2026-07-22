import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResponderTarea } from '@/components/paciente/ResponderTarea';
import { HojaMembretada } from '@/components/ui/HojaMembretada';

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
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
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
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Tareas</h1>
      <p className="mt-1 text-sm text-ink/60">Lo que tu terapeuta te asignó. Respóndelas a tu ritmo.</p>

      {!tareas || tareas.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          No tienes tareas asignadas por ahora.
        </div>
      ) : (
        <ul className="mt-6 space-y-6">
          {tareas.map((t) => {
            const est = ESTADO_LABEL[t.estado] ?? { label: t.estado, color: 'bg-ink/10 text-ink/50' };
            const feedback = (t.respuestas ?? [])
              .filter((r) => r.retroalimentacion)
              .sort((a, b) => (b.retroalimentacion_at ?? '').localeCompare(a.retroalimentacion_at ?? ''))[0];
            const campos = Array.isArray(t.campos_respuesta) ? (t.campos_respuesta as unknown[]) : [];
            const etiqueta = t.fecha_limite
              ? `${est.label} · hasta ${new Date(t.fecha_limite).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
              : est.label;
            return (
              <li key={t.id}>
                <HojaMembretada titulo={t.titulo} subtitulo={t.descripcion} etiqueta={etiqueta}>
                  {t.contenido_md && (
                    <div className="whitespace-pre-wrap font-sans text-[0.95rem] leading-relaxed text-ink/85">
                      {t.contenido_md}
                    </div>
                  )}

                  {feedback?.retroalimentacion && (
                    <div className="mt-4 rounded-lg bg-noema-sage/10 p-3 text-sm">
                      <p className="text-[11px] uppercase tracking-wider text-noema-deep/60">
                        Tu terapeuta comentó
                      </p>
                      <p className="text-ink/80">{feedback.retroalimentacion}</p>
                    </div>
                  )}

                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <ResponderTarea tareaId={t.id} campos={campos as any} />
                </HojaMembretada>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
