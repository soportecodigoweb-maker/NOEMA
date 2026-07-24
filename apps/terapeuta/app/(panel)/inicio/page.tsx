import Link from 'next/link';
import {
  Plus,
  AlertTriangle,
  Users,
  CalendarDays,
  Activity,
  ClipboardCheck,
  MessageCircle,
  ArrowUpRight,
  LifeBuoy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { tiempoRelativo, formatHora } from '@/lib/utils';
import { perfilesPorId } from '@/lib/perfiles-lookup';
import { CentroNotificaciones } from '@/components/notificaciones/CentroNotificaciones';
import { RefrescarEnVivo } from '@/components/util/RefrescarEnVivo';
import { Sparkline, Anillo, Barras, Tendencia, CHART_COLORS } from '@/components/charts/Charts';

export const metadata = { title: 'Inicio' };
export const dynamic = 'force-dynamic';

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ahora = new Date();
  const hace14 = new Date(ahora.getTime() - 14 * 86400000);
  const hace28 = new Date(ahora.getTime() - 28 * 86400000);
  const inicioSemana = startOfWeek();
  const finSemana = endOfWeek();

  const [
    { data: profile },
    { count: pacientesActivos },
    { data: sesiones },
    { count: alertas },
    { data: vinculaciones },
    { data: registros },
    { count: tareasPendientes },
    { count: mensajesSinLeer },
  ] = await Promise.all([
    supabase.from('profiles').select('nombre').eq('id', user.id).single(),
    supabase
      .from('vinculaciones')
      .select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id)
      .eq('estado', 'activa'),
    // Sesiones de las próximas 2 semanas + realizadas recientes (para métricas)
    supabase
      .from('sesiones')
      .select('id, fecha_programada, estado, modalidad, vinculacion_id')
      .gte('fecha_programada', hace28.toISOString())
      .order('fecha_programada', { ascending: true }),
    supabase
      .from('alertas_crisis')
      .select('*', { count: 'exact', head: true })
      .eq('notificado_terapeuta', true)
      .eq('resuelta', false),
    supabase
      .from('vinculaciones')
      .select('id, estado, actualizado_at, paciente_id, nivel_riesgo')
      .eq('terapeuta_id', user.id)
      .in('estado', ['activa', 'pausada'])
      .order('actualizado_at', { ascending: false })
      .limit(6),
    // Registros compartidos de mis pacientes (últimos 14 días) para actividad.
    // La RLS ya limita a registros compartidos/marcados de mis pacientes.
    supabase
      .from('registros_emocionales')
      .select('registrado_at')
      .in('privacidad', ['compartido', 'marcado_sesion'])
      .gte('registrado_at', hace14.toISOString()),
    supabase
      .from('tareas')
      .select('id, vinculaciones!inner(terapeuta_id)', { count: 'exact', head: true })
      .eq('vinculaciones.terapeuta_id', user.id)
      .in('estado', ['pendiente', 'en_progreso']),
    supabase
      .from('mensajes')
      .select('id, vinculaciones!inner(terapeuta_id)', { count: 'exact', head: true })
      .eq('vinculaciones.terapeuta_id', user.id)
      .neq('autor_id', user.id)
      .is('leido_at', null),
  ]);

  const sesionesList = sesiones ?? [];
  const proximas = sesionesList
    .filter((s) => new Date(s.fecha_programada) >= ahora && s.estado === 'programada')
    .slice(0, 5);
  const sesionesSemana = sesionesList.filter((s) => {
    const f = new Date(s.fecha_programada);
    return f >= inicioSemana && f < finSemana;
  }).length;
  const realizadas28 = sesionesList.filter((s) => s.estado === 'realizada').length;

  // Serie de actividad: registros compartidos por día (últimos 14 días)
  const porDia = new Array(14).fill(0);
  for (const r of registros ?? []) {
    const dias = Math.floor((ahora.getTime() - new Date(r.registrado_at).getTime()) / 86400000);
    if (dias >= 0 && dias < 14) porDia[13 - dias]++;
  }
  const totalRegistros14 = porDia.reduce((a, b) => a + b, 0);
  const registros7 = porDia.slice(7).reduce((a, b) => a + b, 0);
  const registrosPrev7 = porDia.slice(0, 7).reduce((a, b) => a + b, 0);
  const deltaRegistros =
    registrosPrev7 > 0 ? Math.round(((registros7 - registrosPrev7) / registrosPrev7) * 100) : null;

  // Distribución de riesgo de la cartera
  const perfiles = await perfilesPorId(
    supabase,
    (vinculaciones ?? []).map((v) => v.paciente_id),
  );
  const riesgo = { bajo: 0, medio: 0, alto: 0 };
  for (const v of vinculaciones ?? []) {
    const n = v.nivel_riesgo ?? 'bajo';
    if (n === 'alto' || n === 'critico') riesgo.alto++;
    else if (n === 'medio') riesgo.medio++;
    else riesgo.bajo++;
  }

  // Carga de la semana (sesiones por día, dom→sáb)
  const cargaSemana = DIAS.map((d, i) => {
    const n = sesionesList.filter((s) => {
      const f = new Date(s.fecha_programada);
      return f >= inicioSemana && f < finSemana && f.getDay() === i;
    }).length;
    return { label: d, valor: n };
  });

  const nombreCorto = profile?.nombre?.split(' ')[0] ?? '';

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <RefrescarEnVivo tabla="alertas_crisis" canal="inicio-alertas" />

      {/* Cabecera */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl leading-tight text-ink">
            Hola{nombreCorto ? `, ${nombreCorto}` : ''}
          </h1>
          <p className="mt-2 text-foreground-muted">
            {ahora.toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            · resumen de tu consulta.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CentroNotificaciones />
          <Link href="/sesiones">
            <Button variant="primary" size="md">
              <Plus className="size-4" strokeWidth={2} />
              Nueva sesión
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerta destacada si hay crisis sin resolver */}
      {alertas && alertas > 0 && (
        <Link
          href="/pacientes"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-noema-clay/40 bg-noema-clay/[0.06] px-5 py-4 transition-colors hover:bg-noema-clay/10"
        >
          <LifeBuoy className="size-5 shrink-0 text-noema-clay" strokeWidth={1.9} />
          <p className="flex-1 text-sm text-ink">
            <span className="font-semibold">{alertas} alerta{alertas > 1 ? 's' : ''} de apoyo sin resolver.</span>{' '}
            Revisa a tus pacientes que pidieron ayuda.
          </p>
          <ArrowUpRight className="size-4 text-noema-clay" />
        </Link>
      )}

      {/* KPIs — cada uno enlaza a su sección */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiLink
          href="/pacientes"
          icon={<Users className="size-4" />}
          label="Pacientes activos"
          value={pacientesActivos ?? 0}
          hint="Con seguimiento vigente"
        />
        <KpiLink
          href="/sesiones"
          icon={<CalendarDays className="size-4" />}
          label="Sesiones esta semana"
          value={sesionesSemana}
          hint={`${realizadas28} realizadas en 28 días`}
        />
        <KpiLink
          href="/pacientes"
          icon={<Activity className="size-4" />}
          label="Registros (14 días)"
          value={totalRegistros14}
          extra={<Tendencia delta={deltaRegistros} />}
          spark={porDia}
        />
        <KpiLink
          href="/mensajes"
          icon={<MessageCircle className="size-4" />}
          label="Mensajes sin leer"
          value={mensajesSinLeer ?? 0}
          hint={`${tareasPendientes ?? 0} tareas en curso`}
          alerta={(mensajesSinLeer ?? 0) > 0}
        />
      </div>

      {/* Fila de visualizaciones */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Carga de la semana */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-lg text-ink">Carga de la semana</h2>
            <Link href="/sesiones" className="text-xs text-noema-sage hover:underline">
              Ver agenda →
            </Link>
          </div>
          {cargaSemana.every((d) => d.valor === 0) ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No hay sesiones agendadas esta semana.
            </p>
          ) : (
            <Barras data={cargaSemana} color={CHART_COLORS.SAGE} height={130} />
          )}
        </Card>

        {/* Distribución de riesgo */}
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-lg text-ink">Nivel de riesgo</h2>
            <Link href="/pacientes" className="text-xs text-noema-sage hover:underline">
              Ver →
            </Link>
          </div>
          {(pacientesActivos ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">Sin pacientes aún.</p>
          ) : (
            <div className="flex items-center gap-4">
              <Anillo
                valor={riesgo.alto + riesgo.medio}
                total={riesgo.alto + riesgo.medio + riesgo.bajo}
                color={CHART_COLORS.CLAY}
                centro={
                  <div>
                    <span className="font-serif text-xl text-ink">{riesgo.alto}</span>
                    <span className="block text-[10px] uppercase text-foreground-muted">alto</span>
                  </div>
                }
              />
              <ul className="flex-1 space-y-1.5 text-sm">
                <LeyendaRiesgo color="#B85450" label="Alto / crítico" n={riesgo.alto} />
                <LeyendaRiesgo color="#D9B98C" label="Medio" n={riesgo.medio} />
                <LeyendaRiesgo color="#3D4D3E" label="Bajo" n={riesgo.bajo} />
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Dos columnas: pacientes recientes + próximas sesiones */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-lg text-ink">Tus pacientes</h2>
            <Link href="/pacientes" className="text-xs text-noema-sage hover:underline">
              Ver todos →
            </Link>
          </div>
          {(vinculaciones ?? []).length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-4 text-foreground-muted">Aún no tienes pacientes vinculados.</p>
              <Link href="/pacientes/nuevo">
                <Button variant="primary" size="md">
                  Vincular mi primer paciente
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-noema-deep/[0.06]">
              {(vinculaciones ?? []).map((v) => {
                const p = v.paciente_id ? perfiles.get(v.paciente_id) : null;
                return (
                  <li key={v.id}>
                    <Link
                      href={`/pacientes/${v.id}`}
                      className="-mx-2 flex items-center gap-3 rounded px-2 py-3 transition-colors hover:bg-paper/40"
                    >
                      <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-noema-sage/15 text-xs font-medium text-noema-deep/70">
                        {p?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt={p.nombre} className="size-9 object-cover" />
                        ) : (
                          initials(p?.nombre ?? '?')
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{p?.nombre ?? 'Paciente'}</p>
                        <p className="text-xs text-foreground-muted">
                          Última actividad: {tiempoRelativo(v.actualizado_at)}
                        </p>
                      </div>
                      {(v.nivel_riesgo === 'alto' || v.nivel_riesgo === 'critico') && (
                        <span className="rounded bg-noema-clay/15 px-2 py-1 text-[11px] font-medium text-noema-clay">
                          Riesgo alto
                        </span>
                      )}
                      {v.estado === 'pausada' && (
                        <span className="rounded bg-emotion-ansioso/30 px-2 py-1 text-[11px] text-ink/70">
                          Pausada
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-serif text-lg text-ink">Próximas sesiones</h2>
            <Link href="/sesiones" className="text-xs text-noema-sage hover:underline">
              Agenda →
            </Link>
          </div>
          {proximas.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground-muted">
              No tienes sesiones próximas.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {proximas.map((s) => {
                const f = new Date(s.fecha_programada);
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border border-noema-deep/[0.06] bg-bone/40 px-3 py-2.5"
                  >
                    <div className="text-center">
                      <p className="font-serif text-lg leading-none text-ink">{f.getDate()}</p>
                      <p className="text-[10px] uppercase text-foreground-muted">
                        {f.toLocaleDateString('es-MX', { month: 'short', timeZone: 'America/Mexico_City' })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{formatHora(s.fecha_programada)}</p>
                      <p className="text-xs capitalize text-foreground-muted">{s.modalidad}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function KpiLink({
  href,
  icon,
  label,
  value,
  hint,
  extra,
  spark,
  alerta,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  extra?: React.ReactNode;
  spark?: number[];
  alerta?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-noema-deep/10 bg-white p-5 transition-all hover:border-noema-sage/40 hover:shadow-soft"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex size-8 items-center justify-center rounded-lg bg-noema-sage/10 text-noema-sage">
          {icon}
        </span>
        <ArrowUpRight className="size-4 text-foreground-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <p className={`font-serif text-3xl ${alerta ? 'text-noema-clay' : 'text-ink'}`}>{value}</p>
            {extra}
          </div>
          <p className="caption mt-1">{label}</p>
        </div>
        {spark && spark.some((n) => n > 0) && <Sparkline data={spark} width={90} height={38} />}
      </div>
      {hint && <p className="mt-2 text-xs text-foreground-muted">{hint}</p>}
    </Link>
  );
}

function LeyendaRiesgo({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <li className="flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 text-ink/80">{label}</span>
      <span className="font-medium text-ink">{n}</span>
    </li>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day; // domingo como inicio
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function endOfWeek(): Date {
  const s = startOfWeek();
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 7);
}
