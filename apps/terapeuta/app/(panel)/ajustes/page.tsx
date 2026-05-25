import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { signOutAction } from '../../(auth)/actions';

export const metadata = { title: 'Ajustes' };
export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, email')
    .eq('id', user!.id)
    .single();

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Ajustes</h1>
      <p className="text-foreground-muted mb-8">
        Tu perfil profesional, plan y preferencias.
      </p>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
            <CardDescription>Información básica.</CardDescription>
          </CardHeader>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Nombre</dt>
              <dd className="text-ink font-medium">{profile?.nombre}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground-muted">Correo</dt>
              <dd className="text-ink">{profile?.email}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil profesional</CardTitle>
            <CardDescription>
              Lo que aparece en el directorio público.
            </CardDescription>
          </CardHeader>
          <p className="text-sm text-foreground-muted">
            Edición de perfil profesional · próximamente.
          </p>
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
