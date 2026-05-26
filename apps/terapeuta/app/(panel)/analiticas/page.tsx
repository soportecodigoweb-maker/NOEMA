import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export const metadata = { title: 'Analíticas' };
export const dynamic = 'force-dynamic';

export default async function AnaliticasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Período: últimos 30 días
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  const desdeStr = desde.toISOString().slice(0, 10);

  // KPIs en paralelo
  const [
    { data: vincsAll },
    { count: registrosTotal },
    { count: alertasAbiertas },
    { count: sesionesRealizadas },
    { count: tareasAsignadas },
    { count: tareasCompletadas },
  ] = await Promise.all([
    supabase.from('vinculaciones').select('id, estado, paciente_id').eq('terapeuta_id', user.id),
    contarRegistrosTerapeuta(supabase, user.id, desdeStr),
    supabase
      .from('alertas_crisis')
      .select('*', { count: 'exact', head: true })
      .eq('notificado_terapeuta', true)
      .eq('resuelta', false),
    contarSesionesTerapeuta(supabase, user.id, desdeStr, 'realizada'),
    contarTareasTerapeuta(supabase, user.id, desdeStr),
    contarTareasTerapeuta(supabase, user.id, desdeStr, 'completada'),
  ]);

  const conteoEstados = (vincsAll ?? []).reduce<Record<string, number>>((acc, v: any) => {
    acc[v.estado] = (acc[v.estado] ?? 0) + 1;
    return acc;
  }, {});

  const tasaCompletado = tareasAsignadas && tareasAsignadas > 0
    ? Math.round(((tareasCompletadas ?? 0) / tareasAsignadas) * 100)
    : 0;

  // Top emociones agregadas (todos los pacientes del terapeuta)
  const pacientesIds = (vincsAll ?? [])
    .map((v: any) => v.paciente_id)
    .filter(Boolean) as string[];

  let topEmociones: Array<[string, number]> = [];
  if (pacientesIds.length > 0) {
    const { data: registros } = await supabase
      .from('registros_emocionales')
      .select('emocion_principal_key')
      .in('paciente_id', pacientesIds)
      .gte('fecha', desdeStr);
    const conteo = (registros ?? []).reduce<Record<string, number>>((acc, r: any) => {
      acc[r.emocion_principal_key] = (acc[r.emocion_principal_key] ?? 0) + 1;
      return acc;
    }, {});
    topEmociones = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Analíticas</h1>
        <p className="text-foreground-muted">
          Patrones agregados de tu consulta — últimos 30 días. Información operativa,
          no diagnóstica.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Pacientes activos" value={conteoEstados.activa ?? 0} />
        <Kpi label="Sesiones realizadas" value={sesionesRealizadas ?? 0} />
        <Kpi label="Registros recibidos" value={registrosTotal ?? 0} hint="Compartidos por pacientes" />
        <Kpi
          label="Adherencia a tareas"
          value={`${tasaCompletado}%`}
          hint={`${tareasCompletadas ?? 0} de ${tareasAsignadas ?? 0}`}
        />
      </div>

      {/* Distribución de estados de vinculación */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de tu consulta</CardTitle>
          <CardDescription>Distribución de tus vinculaciones.</CardDescription>
        </CardHeader>
        <ul className="space-y-3">
          {[
            { key: 'activa', label: 'Activos', color: 'bg-noema-sage' },
            { key: 'pausada', label: 'Pausados', color: 'bg-emotion-ansioso' },
            { key: 'finalizada', label: 'Finalizados', color: 'bg-noema-deep/40' },
            { key: 'pendiente', label: 'Pendientes', color: 'bg-emotion-cansado' },
          ].map(({ key, label, color }) => {
            const count = conteoEstados[key] ?? 0;
            const total = vincsAll?.length ?? 1;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <li key={key} className="flex items-center gap-3">
                <span className={`size-3 rounded-full ${color}`} />
                <span className="text-sm font-medium text-ink w-28">{label}</span>
                <div className="flex-1 h-2 bg-noema-deep/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-foreground-muted w-12 text-right">
                  {count} ({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Top emociones agregadas */}
      <Card>
        <CardHeader>
          <CardTitle>Emociones más registradas</CardTitle>
          <CardDescription>
            Lo que más reportaron tus pacientes este periodo. Solo cuenta lo compartido.
          </CardDescription>
        </CardHeader>
        {topEmociones.length === 0 ? (
          <p className="text-sm text-foreground-muted">Sin datos suficientes todavía.</p>
        ) : (
          <ul className="space-y-3">
            {topEmociones.map(([key, count]) => {
              const max = topEmociones[0]?.[1] ?? 1;
              const pct = Math.round((count / max) * 100);
              return (
                <li key={key} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink capitalize w-40">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-2 bg-noema-deep/[0.06] rounded-full overflow-hidden">
                    <div className="h-full bg-noema-sage" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-foreground-muted w-8 text-right">{count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {(alertasAbiertas ?? 0) > 0 && (
        <Card variant="flat" className="bg-[#B85450]/10 border-[#B85450]/30">
          <p className="font-medium text-[#B85450] mb-1">
            Tienes {alertasAbiertas} alerta(s) de crisis sin resolver
          </p>
          <p className="text-sm text-ink/70">
            Revísalas desde la ficha de cada paciente.
          </p>
        </Card>
      )}

      <p className="text-xs text-foreground-muted italic text-center">
        Esta información es operativa, no clínica. Cualquier interpretación es de tu
        criterio profesional.
      </p>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card variant="flat" className="p-5">
      <p className="caption mb-2">{label}</p>
      <p className="font-serif text-4xl text-ink">{value}</p>
      {hint && <p className="text-xs text-foreground-muted mt-1">{hint}</p>}
    </Card>
  );
}

// Helpers para queries que usan subselects
async function contarRegistrosTerapeuta(supabase: any, terapeutaId: string, desdeStr: string) {
  // Paso 1: ids de vinculaciones
  const { data: vincs } = await supabase
    .from('vinculaciones')
    .select('paciente_id')
    .eq('terapeuta_id', terapeutaId);
  const ids = (vincs ?? []).map((v: any) => v.paciente_id).filter(Boolean);
  if (ids.length === 0) return { count: 0 };
  return supabase
    .from('registros_emocionales')
    .select('*', { count: 'exact', head: true })
    .in('paciente_id', ids)
    .gte('fecha', desdeStr);
}

async function contarSesionesTerapeuta(
  supabase: any,
  terapeutaId: string,
  desdeStr: string,
  estado?: string,
) {
  const { data: vincs } = await supabase
    .from('vinculaciones')
    .select('id')
    .eq('terapeuta_id', terapeutaId);
  const ids = (vincs ?? []).map((v: any) => v.id);
  if (ids.length === 0) return { count: 0 };
  let q = supabase
    .from('sesiones')
    .select('*', { count: 'exact', head: true })
    .in('vinculacion_id', ids)
    .gte('fecha_programada', desdeStr);
  if (estado) q = q.eq('estado', estado);
  return q;
}

async function contarTareasTerapeuta(
  supabase: any,
  terapeutaId: string,
  desdeStr: string,
  estado?: string,
) {
  const { data: vincs } = await supabase
    .from('vinculaciones')
    .select('id')
    .eq('terapeuta_id', terapeutaId);
  const ids = (vincs ?? []).map((v: any) => v.id);
  if (ids.length === 0) return { count: 0 };
  let q = supabase
    .from('tareas')
    .select('*', { count: 'exact', head: true })
    .in('vinculacion_id', ids)
    .gte('creado_at', desdeStr);
  if (estado) q = q.eq('estado', estado);
  return q;
}
