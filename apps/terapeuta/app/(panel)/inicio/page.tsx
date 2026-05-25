import Link from 'next/link';
import { Plus, Bell, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { tiempoRelativo } from '@/lib/utils';

export const metadata = { title: 'Inicio' };
export const dynamic = 'force-dynamic';

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // KPIs en paralelo
  const [
    { data: profile },
    { count: pacientesActivos },
    { count: sesionesSemana },
    { count: alertas },
    { data: vinculaciones },
  ] = await Promise.all([
    supabase.from('profiles').select('nombre').eq('id', user.id).single(),
    supabase
      .from('vinculaciones')
      .select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id)
      .eq('estado', 'activa'),
    supabase
      .from('sesiones')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_programada', startOfWeek().toISOString())
      .lt('fecha_programada', endOfWeek().toISOString()),
    supabase
      .from('alertas_crisis')
      .select('*', { count: 'exact', head: true })
      .eq('notificado_terapeuta', true)
      .eq('resuelta', false),
    supabase
      .from('vinculaciones')
      .select(
        `
        id,
        estado,
        actualizado_at,
        paciente:profiles!vinculaciones_paciente_id_fkey(nombre, avatar_url)
        `,
      )
      .eq('terapeuta_id', user.id)
      .in('estado', ['activa', 'pausada'])
      .order('actualizado_at', { ascending: false })
      .limit(6),
  ]);

  const nombreCorto = profile?.nombre?.split(' ')[0] ?? '';

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-serif text-4xl text-ink leading-tight">
            Hola{nombreCorto ? `, ${nombreCorto}` : ''}
          </h1>
          <p className="text-foreground-muted mt-2">
            Aquí tienes un resumen de tu consulta.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="size-10 rounded-md hover:bg-bone flex items-center justify-center text-noema-deep/70 hover:text-noema-deep"
            aria-label="Notificaciones"
          >
            <Bell size={18} strokeWidth={1.6} />
          </button>
          <Link href="/sesiones">
            <Button variant="primary" size="md">
              <Plus className="size-4" strokeWidth={2} />
              Nueva sesión
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Pacientes activos"
          value={pacientesActivos ?? 0}
          hint="Con seguimiento vigente"
        />
        <KpiCard
          label="Sesiones esta semana"
          value={sesionesSemana ?? 0}
          hint="Programadas L–D"
        />
        <KpiCard
          label="Adherencia promedio"
          value="—"
          hint="Próximamente"
        />
        <KpiCard
          label="Alertas importantes"
          value={alertas ?? 0}
          hint="Requieren tu atención"
          variant={alertas && alertas > 0 ? 'alert' : 'default'}
        />
      </div>

      {/* Dos columnas: actividad reciente + bienestar grupal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tus pacientes</CardTitle>
            <CardDescription>
              Quien tiene actividad más reciente aparece arriba.
            </CardDescription>
          </CardHeader>
          {!vinculaciones || vinculaciones.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-foreground-muted mb-4">
                Aún no tienes pacientes vinculados.
              </p>
              <Link href="/pacientes/nuevo">
                <Button variant="primary" size="md">
                  Vincular mi primer paciente
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-noema-deep/[0.06]">
              {vinculaciones.map((v: any) => (
                <li key={v.id}>
                  <Link
                    href={`/pacientes/${v.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-paper/40 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="size-9 rounded-full bg-noema-sage/15 flex items-center justify-center text-noema-deep/70 text-xs font-medium">
                      {initials(v.paciente?.nombre ?? '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">
                        {v.paciente?.nombre ?? 'Paciente'}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Última actividad: {tiempoRelativo(v.actualizado_at)}
                      </p>
                    </div>
                    {v.estado === 'pausada' && (
                      <span className="caption px-2 py-1 rounded bg-emotion-ansioso/30 text-ink/70">
                        Pausada
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas sesiones</CardTitle>
            <CardDescription>Tu agenda de los próximos días.</CardDescription>
          </CardHeader>
          <div className="py-8 text-center">
            <p className="text-foreground-muted text-sm">
              Cuando programes sesiones, aparecerán aquí.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  variant?: 'default' | 'alert';
}

function KpiCard({ label, value, hint, variant = 'default' }: KpiCardProps) {
  return (
    <Card variant="flat" className="p-5">
      <p className="caption mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p
          className={`font-serif text-4xl ${
            variant === 'alert' ? 'text-[#B85450]' : 'text-ink'
          }`}
        >
          {value}
        </p>
        {variant === 'alert' && value !== 0 && (
          <AlertTriangle className="size-4 text-[#B85450]" strokeWidth={1.8} />
        )}
      </div>
      {hint && <p className="text-xs text-foreground-muted mt-2">{hint}</p>}
    </Card>
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
  const day = (d.getDay() + 6) % 7; // L=0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek(): Date {
  const d = startOfWeek();
  d.setDate(d.getDate() + 7);
  return d;
}
