import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { PerfilEditor } from './PerfilEditor';
import { PlanCard } from './PlanCard';
import { PanelConfiguracion } from '@/components/ajustes/PanelConfiguracion';
import { ZonaCuenta } from '@/components/cuenta/ZonaCuenta';
import { SubirAvatar } from '@/components/cuenta/SubirAvatar';
import type { ConfigTerapeuta } from './config-actions';

export const metadata = { title: 'Ajustes' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  searchParams: Promise<{ stripe?: string }>;
}

export default async function AjustesPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    { data: profile },
    { data: terapeuta },
    { data: facturas },
    { count: pacientesActivos },
    { data: config },
  ] = await Promise.all([
    supabase.from('profiles').select('nombre, email, ciudad, avatar_url').eq('id', user.id).single(),
    supabase
      .from('terapeutas')
      .select('titulo, descripcion, cedula_profesional, especialidades, enfoques, estado_verificacion, plan_estado, trial_termina_at, stripe_subscription_id')
      .eq('profile_id', user.id)
      .maybeSingle(),
    supabase
      .from('stripe_facturas')
      .select('id, monto_centavos, moneda, estado, pacientes_count, periodo_inicio, periodo_fin, url_pdf, pagada_at')
      .eq('terapeuta_id', user.id)
      .order('pagada_at', { ascending: false })
      .limit(6),
    supabase
      .from('vinculaciones')
      .select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id)
      .eq('estado', 'activa'),
    supabase
      .from('configuracion_terapeuta')
      .select('*')
      .eq('terapeuta_id', user.id)
      .maybeSingle(),
  ]);

  // Si aún no tiene fila de configuración, mostramos los valores por defecto.
  const configInicial: ConfigTerapeuta = {
    sos_habilitado: config?.sos_habilitado ?? true,
    chat_habilitado: config?.chat_habilitado ?? true,
    agenda_habilitada: config?.agenda_habilitada ?? false,
    diario_habilitado: config?.diario_habilitado ?? true,
    registros_habilitados: config?.registros_habilitados ?? true,
    tareas_habilitadas: config?.tareas_habilitadas ?? true,
    progreso_habilitado: config?.progreso_habilitado ?? true,
    mensajes_ia_habilitados: config?.mensajes_ia_habilitados ?? true,
    notif_paciente: config?.notif_paciente ?? true,
    notif_sonido: config?.notif_sonido ?? 'suave',
    notif_mensajes: config?.notif_mensajes ?? true,
    notif_registros: config?.notif_registros ?? true,
    notif_crisis: config?.notif_crisis ?? true,
    notif_tareas: config?.notif_tareas ?? true,
    no_molestar_activo: config?.no_molestar_activo ?? false,
    no_molestar_desde: config?.no_molestar_desde ?? '21:00',
    no_molestar_hasta: config?.no_molestar_hasta ?? '08:00',
  };

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10 max-w-3xl mx-auto">
      <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Ajustes</h1>
      <p className="text-foreground-muted mb-8">
        Tu perfil profesional, plan y preferencias.
      </p>

      {params.stripe === 'success' && (
        <Card variant="flat" className="bg-emotion-tranquilo/20 border-emotion-tranquilo mb-4">
          <p className="text-ink font-medium">
            Suscripción activada. Tu plan empezará en cuanto termine la prueba.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Perfil profesional</CardTitle>
            <CardDescription>
              Lo que aparece en el directorio público cuando estés verificado.
              {terapeuta?.estado_verificacion === 'en_revision' && (
                <span className="block mt-1 text-emotion-cansado">
                  Tu cédula está en revisión.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <div className="mb-5">
            <SubirAvatar
              userId={user.id}
              avatarUrl={profile?.avatar_url ?? null}
              nombre={profile?.nombre ?? ''}
            />
          </div>
          <PerfilEditor
            profile={{
              nombre: profile?.nombre ?? '',
              email: profile?.email ?? '',
              ciudad: profile?.ciudad ?? '',
            }}
            terapeuta={{
              titulo: terapeuta?.titulo ?? '',
              descripcion: terapeuta?.descripcion ?? '',
              cedula: terapeuta?.cedula_profesional ?? '',
              especialidades: (terapeuta?.especialidades ?? []).join(', '),
              enfoques: (terapeuta?.enfoques ?? []).join(', '),
            }}
          />
        </Card>

        {/* Funciones del paciente y notificaciones */}
        <PanelConfiguracion inicial={configInicial} />

        <PlanCard
          planEstado={terapeuta?.plan_estado ?? 'sin_pago'}
          trialTerminaAt={terapeuta?.trial_termina_at ?? null}
          pacientesActivos={pacientesActivos ?? 0}
          facturas={(facturas as any[]) ?? []}
        />

        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
          </CardHeader>
          <ZonaCuenta />
        </Card>
      </div>
    </div>
  );
}
