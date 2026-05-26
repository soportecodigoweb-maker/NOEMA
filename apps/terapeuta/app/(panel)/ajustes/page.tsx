import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PerfilEditor } from './PerfilEditor';
import { signOutAction } from '../../(auth)/actions';

export const metadata = { title: 'Ajustes' };
export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: terapeuta }] = await Promise.all([
    supabase.from('profiles').select('nombre, email, ciudad').eq('id', user.id).single(),
    supabase
      .from('terapeutas')
      .select('titulo, descripcion, cedula_profesional, especialidades, enfoques, estado_verificacion')
      .eq('profile_id', user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Ajustes</h1>
      <p className="text-foreground-muted mb-8">
        Tu perfil profesional, plan y preferencias.
      </p>

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

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>
              Estás en plan gratuito. El paciente activo cuesta $100 MXN/mes.
            </CardDescription>
          </CardHeader>
          <p className="text-sm text-foreground-muted">
            Facturación y pago de Stripe · próximamente.
          </p>
        </Card>

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
