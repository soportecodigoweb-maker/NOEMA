import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { formatFecha } from '@/lib/utils';
import { CalendarCheck, ClipboardList, PenLine, HeartPulse, TrendingUp } from 'lucide-react';
import { NotaInicialNOM004 } from '@/components/pacientes/NotaInicialNOM004';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Historial clínico del paciente (requerimiento terapeuta #4).
 *
 * Estructura inspirada en NOM-004-SSA3-2012 (expediente clínico): identificación,
 * evolución (timeline), y métricas de adherencia con datos duros. La información
 * es acumulativa — nada se borra.
 */
export default async function HistorialPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, paciente_id, fecha_inicio, estado, nivel_riesgo')
    .eq('id', id)
    .single();

  if (!vinc) return null;

  const pacienteId = vinc.paciente_id;

  // Datos para métricas y timeline (en paralelo)
  const [
    { data: perfil },
    { data: pacienteInfo },
    { count: totalRegistros },
    { data: tareas },
    { data: sesiones },
    { data: notas },
    { count: alertas },
    { data: expediente },
  ] = await Promise.all([
    pacienteId
      ? supabase.from('profiles').select('nombre, email, ciudad').eq('id', pacienteId).maybeSingle()
      : Promise.resolve({ data: null }),
    pacienteId
      ? supabase
          .from('pacientes')
          .select('fecha_nacimiento, genero, ocupacion, motivos_consulta')
          .eq('profile_id', pacienteId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('registros_emocionales')
      .select('*', { count: 'exact', head: true })
      .eq('paciente_id', pacienteId ?? '')
      .in('privacidad', ['compartido', 'marcado_sesion']),
    supabase.from('tareas').select('id, titulo, estado, creado_at').eq('vinculacion_id', id),
    supabase
      .from('sesiones')
      .select('id, numero, fecha_programada, fecha_realizada, estado, modalidad')
      .eq('vinculacion_id', id)
      .order('fecha_programada', { ascending: false }),
    supabase
      .from('sesion_notas')
      .select('id, contenido_publico, plan_proxima_sesion, creado_at, sesion_id')
      .order('creado_at', { ascending: false }),
    supabase
      .from('alertas_crisis')
      .select('*', { count: 'exact', head: true })
      .eq('paciente_id', pacienteId ?? ''),
    supabase
      .from('expediente_inicial')
      .select('*')
      .eq('vinculacion_id', id)
      .maybeSingle(),
  ]);

  // ── Métricas de adherencia (datos duros) ──
  const tareasList = tareas ?? [];
  const tareasCompletadas = tareasList.filter((t) => t.estado === 'completada').length;
  const tareasConProgreso = tareasList.filter(
    (t) => t.estado === 'completada' || t.estado === 'en_progreso',
  ).length;
  const adherenciaTareas =
    tareasList.length > 0 ? Math.round((tareasConProgreso / tareasList.length) * 100) : null;

  const sesionesList = sesiones ?? [];
  const sesionesRealizadas = sesionesList.filter((s) => s.estado === 'realizada').length;
  const sesionesNoAsistio = sesionesList.filter((s) => s.estado === 'cancelada').length;

  // Días en tratamiento
  const diasTratamiento = vinc.fecha_inicio
    ? Math.floor((Date.now() - new Date(vinc.fecha_inicio).getTime()) / 86400000)
    : 0;

  // ── Timeline consolidado (eventos clínicamente relevantes) ──
  type Evento = { fecha: string; tipo: string; texto: string; icono: 'sesion' | 'tarea' | 'nota' | 'alerta' };
  const eventos: Evento[] = [];
  for (const s of sesionesList) {
    eventos.push({
      fecha: s.fecha_realizada ?? s.fecha_programada,
      tipo: 'Sesión',
      texto: `Sesión ${s.numero ?? ''} — ${estadoSesionLabel(s.estado)} (${s.modalidad})`,
      icono: 'sesion',
    });
  }
  for (const t of tareasList) {
    eventos.push({
      fecha: t.creado_at,
      tipo: 'Tarea',
      texto: `Asignada: ${t.titulo} (${t.estado})`,
      icono: 'tarea',
    });
  }
  for (const n of notas ?? []) {
    if (n.contenido_publico || n.plan_proxima_sesion) {
      eventos.push({
        fecha: n.creado_at,
        tipo: 'Nota de sesión',
        texto: n.plan_proxima_sesion
          ? `Plan: ${n.plan_proxima_sesion.slice(0, 120)}`
          : (n.contenido_publico ?? '').slice(0, 120),
        icono: 'nota',
      });
    }
  }
  eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const edad = pacienteInfo?.fecha_nacimiento
    ? Math.floor(
        (Date.now() - new Date(pacienteInfo.fecha_nacimiento).getTime()) / (365.25 * 86400000),
      )
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-ink mb-1">Historial clínico</h2>
        <p className="text-sm text-foreground-muted">
          Expediente acumulativo del paciente. Estructura basada en NOM-004-SSA3-2012.
          Nada se elimina.
        </p>
      </div>

      {/* Identificación (NOM-004) */}
      <Card variant="flat">
        <h3 className="caption mb-3">Ficha de identificación</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Campo label="Nombre" valor={perfil?.nombre} />
          <Campo label="Edad" valor={edad ? `${edad} años` : null} />
          <Campo label="Género" valor={pacienteInfo?.genero} />
          <Campo label="Ciudad" valor={perfil?.ciudad} />
          <Campo label="Ocupación" valor={pacienteInfo?.ocupacion} />
          <Campo label="Inicio de tratamiento" valor={vinc.fecha_inicio ? formatFecha(vinc.fecha_inicio) : null} />
          <Campo
            label="Motivos de consulta"
            valor={pacienteInfo?.motivos_consulta?.join(', ')}
          />
          <Campo label="Nivel de riesgo actual" valor={vinc.nivel_riesgo} />
        </dl>
      </Card>

      {/* Nota clínica inicial (NOM-004) — primera sesión (#7) */}
      <NotaInicialNOM004 vinculacionId={id} inicial={expediente ?? null} />

      {/* Métricas de adherencia (datos duros) */}
      <div>
        <h3 className="caption mb-3">Adherencia y actividad (datos duros)</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metrica icono={<TrendingUp className="size-4" />} valor={`${diasTratamiento}`} label="Días en tratamiento" />
          <Metrica icono={<CalendarCheck className="size-4" />} valor={`${sesionesRealizadas}`} label="Sesiones realizadas" />
          <Metrica
            icono={<ClipboardList className="size-4" />}
            valor={adherenciaTareas !== null ? `${adherenciaTareas}%` : '—'}
            label={`Adherencia tareas (${tareasCompletadas}/${tareasList.length})`}
          />
          <Metrica icono={<PenLine className="size-4" />} valor={`${totalRegistros ?? 0}`} label="Registros compartidos" />
        </div>
        {(sesionesNoAsistio > 0 || (alertas ?? 0) > 0) && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {sesionesNoAsistio > 0 && (
              <span className="rounded bg-amber-400/15 px-2 py-1 text-amber-700">
                {sesionesNoAsistio} sesión(es) cancelada/no asistió
              </span>
            )}
            {(alertas ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-red-500/15 px-2 py-1 text-red-700">
                <HeartPulse className="size-3" /> {alertas} alerta(s) de crisis en el historial
              </span>
            )}
          </div>
        )}
      </div>

      {/* Evolución — timeline (NOM-004: notas de evolución) */}
      <div>
        <h3 className="caption mb-3">Evolución</h3>
        {eventos.length === 0 ? (
          <Card variant="flat" className="py-8 text-center">
            <p className="text-sm text-foreground-muted">
              Aún no hay eventos registrados en el historial.
            </p>
          </Card>
        ) : (
          <Card variant="flat" className="p-0">
            <ul className="divide-y divide-noema-deep/[0.06]">
              {eventos.slice(0, 40).map((e, i) => (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <div className="mt-0.5 shrink-0 text-noema-sage">
                    <EventoIcono tipo={e.icono} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-foreground-muted">
                        {e.tipo}
                      </span>
                      <span className="text-xs text-foreground-muted">
                        {formatFecha(e.fecha)}
                      </span>
                    </div>
                    <p className="text-sm text-ink/80">{e.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <p className="text-xs text-foreground-muted">
        Nota: este historial es una base que sigue el espíritu de la NOM-004. Para
        cumplimiento formal completo, valida los campos con tu criterio profesional y
        la normativa vigente.
      </p>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-foreground-muted">{label}</dt>
      <dd className="text-ink/85">{valor || '—'}</dd>
    </div>
  );
}

function Metrica({ icono, valor, label }: { icono: React.ReactNode; valor: string; label: string }) {
  return (
    <div className="rounded-xl bg-noema-sage/8 p-3">
      <div className="mb-1 text-noema-sage">{icono}</div>
      <p className="font-serif text-2xl text-ink">{valor}</p>
      <p className="text-[11px] leading-tight text-foreground-muted">{label}</p>
    </div>
  );
}

function EventoIcono({ tipo }: { tipo: 'sesion' | 'tarea' | 'nota' | 'alerta' }) {
  const cls = 'size-4';
  if (tipo === 'sesion') return <CalendarCheck className={cls} strokeWidth={1.7} />;
  if (tipo === 'tarea') return <ClipboardList className={cls} strokeWidth={1.7} />;
  if (tipo === 'alerta') return <HeartPulse className={cls} strokeWidth={1.7} />;
  return <PenLine className={cls} strokeWidth={1.7} />;
}

function estadoSesionLabel(estado: string): string {
  const map: Record<string, string> = {
    programada: 'programada',
    realizada: 'realizada',
    cancelada: 'cancelada',
    reagendada: 'reagendada',
    no_asistio: 'no asistió',
  };
  return map[estado] ?? estado;
}
