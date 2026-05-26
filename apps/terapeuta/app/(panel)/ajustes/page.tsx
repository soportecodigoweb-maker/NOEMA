import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PerfilEditor } from './PerfilEditor';
import { PlanCard } from './PlanCard';
import { signOutAction } from '../../(auth)/actions';

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
  ] = await Promise.all([
    supabase.from('profiles').select('nombre, email, ciudad').eq('id', user.id).single(),
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
  ]);

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
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

        <PlanCard
          planEstado={terapeuta?.plan_estado ?? 'sin_pago'}
          trialTerminaAt={terapeuta?.trial_termina_at ?? null}
          pacientesActivos={pacientesActivos ?? 0}
          facturas={(facturas as any[]) ?? []}
        />

        <Card>
          <CardHeader>
            <CardTitle>Sesión</CardTitle>
          </CardHeader>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="md">
              Cerrar sesión
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
