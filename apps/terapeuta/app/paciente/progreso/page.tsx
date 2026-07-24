import { redirect } from 'next/navigation';
import {
  Flame,
  CalendarCheck,
  ClipboardCheck,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Award,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { exigirFuncionPaciente } from '@/lib/funciones-paciente';
import { Anillo, Sparkline, Tendencia, CHART_COLORS } from '@/components/charts/Charts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Progreso' };

const BIENESTAR = new Set(['tranquilo', 'feliz']);

export default async function ProgresoPage() {
  await exigirFuncionPaciente('progreso_habilitado');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const hoy = new Date();
  const hace56 = new Date(hoy.getTime() - 56 * 86400000);

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  const [{ data: regs }, { data: cat }, { data: sesiones }, { data: tareas }] = await Promise.all([
    supabase
      .from('registros_emocionales')
      .select('emocion_principal_key, intensidad, fecha')
      .eq('paciente_id', user.id)
      .gte('fecha', hace56.toISOString().slice(0, 10))
      .order('fecha', { ascending: true }),
    supabase.from('emociones_catalogo').select('key, familia'),
    vinc
      ? supabase.from('sesiones').select('estado').eq('vinculacion_id', vinc.id)
      : Promise.resolve({ data: [] as { estado: string }[] }),
    vinc
      ? supabase.from('tareas').select('estado').eq('vinculacion_id', vinc.id)
      : Promise.resolve({ data: [] as { estado: string }[] }),
  ]);

  const familia = new Map((cat ?? []).map((c) => [c.key, c.familia]));
  const registros = regs ?? [];

  // ── Consistencia: días activos y racha ──
  const diasConRegistro = new Set(registros.map((r) => r.fecha));
  const clave = (d: Date) => d.toISOString().slice(0, 10);
  let racha = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(hoy.getTime() - i * 86400000);
    if (diasConRegistro.has(clave(d))) racha++;
    else if (i > 0) break; // permite que hoy aún no tenga registro
    else if (i === 0) continue;
  }
  const diasActivos30 = [...diasConRegistro].filter(
    (f) => new Date(f) >= new Date(hoy.getTime() - 30 * 86400000),
  ).length;

  // ── Bienestar por semana (8 semanas) ──
  const serieBienestar: number[] = [];
  for (let s = 7; s >= 0; s--) {
    const ini = new Date(hoy.getTime() - (s + 1) * 7 * 86400000);
    const fin = new Date(hoy.getTime() - s * 7 * 86400000);
    const enSemana = registros.filter((r) => {
      const f = new Date(r.fecha);
      return f >= ini && f < fin;
    });
    const bien = enSemana.filter((r) => BIENESTAR.has(familia.get(r.emocion_principal_key) ?? '')).length;
    serieBienestar.push(enSemana.length ? Math.round((bien / enSemana.length) * 100) : 0);
  }
  const bienestarActual = serieBienestar.slice(4).filter((x) => x > 0);
  const bienestarPrevio = serieBienestar.slice(0, 4).filter((x) => x > 0);
  const promActual = bienestarActual.length ? bienestarActual.reduce((a, b) => a + b, 0) / bienestarActual.length : 0;
  const promPrevio = bienestarPrevio.length ? bienestarPrevio.reduce((a, b) => a + b, 0) / bienestarPrevio.length : 0;
  const deltaBienestar = promPrevio > 0 ? Math.round(((promActual - promPrevio) / promPrevio) * 100) : null;

  const sesionesAsistidas = (sesiones ?? []).filter((s) => s.estado === 'realizada').length;
  const tareasCompletadas = (tareas ?? []).filter((t) => t.estado === 'completada').length;

  // ── Puntaje de progreso (0-100), algorítmico ──
  const pConsistencia = Math.min(1, diasActivos30 / 20) * 40; // hasta 40
  const pBienestar = (promActual / 100) * 25; // hasta 25
  const pTareas = Math.min(1, tareasCompletadas / 5) * 20; // hasta 20
  const pSesiones = Math.min(1, sesionesAsistidas / 4) * 15; // hasta 15
  const puntaje = Math.round(pConsistencia + pBienestar + pTareas + pSesiones);
  const nivel =
    puntaje >= 75 ? 'Excelente constancia' : puntaje >= 50 ? 'Buen camino' : puntaje >= 25 ? 'Vas avanzando' : 'Apenas empiezas';

  // ── Logros positivos (solo lo bueno, para motivar) ──
  const logros: { icon: React.ReactNode; texto: string }[] = [];
  if (racha >= 2) logros.push({ icon: <Flame className="size-4 text-amber-500" />, texto: `Llevas ${racha} día${racha > 1 ? 's' : ''} seguidos registrando. ¡Sigue así!` });
  if (diasActivos30 >= 10) logros.push({ icon: <Sparkles className="size-4 text-noema-sage" />, texto: `Registraste en ${diasActivos30} días este último mes. Conocerte es un logro.` });
  if (deltaBienestar !== null && deltaBienestar > 0) logros.push({ icon: <TrendingUp className="size-4 text-emerald-600" />, texto: `Tu bienestar subió ${deltaBienestar}% respecto a semanas anteriores.` });
  if (tareasCompletadas > 0) logros.push({ icon: <ClipboardCheck className="size-4 text-emerald-600" />, texto: `Completaste ${tareasCompletadas} tarea${tareasCompletadas > 1 ? 's' : ''}. Cada una cuenta.` });
  if (sesionesAsistidas > 0) logros.push({ icon: <CalendarCheck className="size-4 text-noema-sage" />, texto: `Asististe a ${sesionesAsistidas} sesión${sesionesAsistidas > 1 ? 'es' : ''}. Estás cuidando tu proceso.` });

  // ── Recomendaciones (si algo puede mejorar) ──
  const tips: string[] = [];
  if (diasActivos30 < 10) tips.push('Intenta registrar cómo te sientes al menos una vez al día. Con un minuto basta y te ayuda a notar patrones.');
  if ((tareas ?? []).some((t) => t.estado === 'pendiente')) tips.push('Tienes tareas pendientes. Hacerlas a tu ritmo suma a tu progreso.');
  if (deltaBienestar !== null && deltaBienestar < 0) tips.push('Han sido semanas con más momentos difíciles. Apóyate en tu terapeuta y usa el botón de apoyo si lo necesitas.');
  if (sesionesAsistidas === 0) tips.push('Cuando tengas una sesión agendada, asistir es una de las cosas que más ayuda a tu avance.');

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Tu progreso</h1>
        <p className="mt-1 text-sm text-ink/60">Lo que has ido construyendo, paso a paso.</p>
      </div>

      {/* Puntaje + bienestar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-noema-deep/10 bg-white p-5 sm:col-span-1">
          <Anillo
            valor={puntaje}
            total={100}
            color={CHART_COLORS.SAGE}
            size={92}
            grosor={9}
            centro={
              <div>
                <span className="font-serif text-xl text-ink">{puntaje}</span>
                <span className="block text-[10px] text-foreground-muted">de 100</span>
              </div>
            }
          />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-noema-sage/12 px-2.5 py-1 text-xs font-medium text-noema-deep">
              <Award className="size-3.5" /> {nivel}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
              Tu puntaje combina qué tan seguido registras, tu bienestar, tus tareas y tus sesiones.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-noema-deep/10 bg-white p-5 sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="caption">Bienestar por semana</p>
            <Tendencia delta={deltaBienestar} />
          </div>
          {serieBienestar.some((x) => x > 0) ? (
            <Sparkline data={serieBienestar} width={440} height={64} color={CHART_COLORS.SAGE} fluid />
          ) : (
            <p className="py-6 text-center text-xs text-foreground-muted">
              Registra emociones para ver cómo evoluciona tu bienestar.
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Mini icon={<Flame className="size-4 text-amber-500" />} valor={racha} label="racha (días)" />
            <Mini icon={<ClipboardCheck className="size-4 text-noema-sage" />} valor={tareasCompletadas} label="tareas hechas" />
            <Mini icon={<CalendarCheck className="size-4 text-noema-sage" />} valor={sesionesAsistidas} label="sesiones" />
          </div>
        </div>
      </div>

      {/* Logros */}
      {logros.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-1.5 font-serif text-lg text-ink">
            <Sparkles className="size-4 text-noema-sage" /> Tus logros
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {logros.map((l, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-noema-sage/20 bg-noema-sage/[0.05] p-3.5">
                <span className="mt-0.5 shrink-0">{l.icon}</span>
                <p className="text-sm text-ink/85">{l.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {tips.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 font-serif text-lg text-ink">
            <Lightbulb className="size-4 text-noema-sage" /> Para seguir avanzando
          </h2>
          <ul className="space-y-2">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-xl border border-noema-deep/10 bg-white p-3.5">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-noema-sage" strokeWidth={1.8} />
                <p className="text-sm text-ink/80">{t}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {logros.length === 0 && tips.length === 0 && (
        <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white p-10 text-center text-ink/50">
          Empieza a registrar cómo te sientes y aquí verás tu progreso y tus logros.
        </div>
      )}
    </div>
  );
}

function Mini({ icon, valor, label }: { icon: React.ReactNode; valor: number; label: string }) {
  return (
    <div className="rounded-lg bg-bone/60 py-2">
      <div className="flex justify-center">{icon}</div>
      <p className="font-serif text-lg text-ink">{valor}</p>
      <p className="text-[10px] leading-tight text-foreground-muted">{label}</p>
    </div>
  );
}
