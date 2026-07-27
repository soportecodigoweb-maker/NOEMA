import { createClient } from '@/lib/supabase/server';
import { PlanApoyoTerapeuta } from './PlanApoyoTerapeuta';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanApoyoPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plan }, { data: recursos }, { data: usos }] = await Promise.all([
    supabase
      .from('plan_apoyo')
      .select('contacto_nombre, contacto_relacion, contacto_telefono, plan_seguridad')
      .eq('vinculacion_id', id)
      .maybeSingle(),
    supabase
      .from('plan_apoyo_recursos')
      .select('id, tipo, titulo, url, nota')
      .eq('vinculacion_id', id)
      .order('creado_at', { ascending: true }),
    supabase
      .from('plan_apoyo_usos')
      .select('id, usado_at, retroalimentacion')
      .eq('vinculacion_id', id)
      .order('usado_at', { ascending: false })
      .limit(50),
  ]);

  const usosFmt = (usos ?? []).map((u) => ({
    id: u.id,
    fecha: new Date(u.usado_at).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City',
    }),
    retroalimentacion: u.retroalimentacion,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-serif text-2xl text-ink">Plan de apoyo</h2>
        <p className="text-sm text-foreground-muted">
          Configura el contacto de emergencia, el plan de seguridad y los recursos. El paciente
          puede verlos y editar su plan; verás aquí cuando lo use.
        </p>
      </div>
      <PlanApoyoTerapeuta vinculacionId={id} plan={plan} recursos={recursos ?? []} usos={usosFmt} />
    </div>
  );
}
