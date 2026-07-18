import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import {
  PacientesListClient,
  type VinculacionRow,
} from '@/components/pacientes/PacientesListClient';

export const metadata = { title: 'Pacientes' };
export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vinculaciones } = await supabase
    .from('vinculaciones')
    .select(
      `
      id,
      estado,
      fecha_inicio,
      actualizado_at,
      codigo_invitacion,
      nivel_riesgo,
      sos_habilitado,
      paciente:profiles!vinculaciones_paciente_id_fkey(id, nombre, avatar_url)
      `,
    )
    .eq('terapeuta_id', user.id)
    .order('actualizado_at', { ascending: false });

  const rows: VinculacionRow[] = (vinculaciones ?? []).map((v) => ({
    id: v.id,
    estado: v.estado,
    fecha_inicio: v.fecha_inicio,
    actualizado_at: v.actualizado_at,
    codigo_invitacion: v.codigo_invitacion,
    nivel_riesgo: v.nivel_riesgo,
    sos_habilitado: v.sos_habilitado,
    paciente: unwrapOne(v.paciente),
  }));

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-4xl leading-tight text-ink">Pacientes</h1>
          <p className="mt-2 text-foreground-muted">
            Administra tus vinculaciones, asigna tareas y revisa avances.
          </p>
        </div>
        <Link href="/pacientes/nuevo">
          <Button variant="primary" size="md">
            <Plus className="size-4" strokeWidth={2} />
            Nuevo paciente
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-noema-deep/10 bg-white py-16 text-center">
          <p className="mb-6 text-foreground-muted">Aún no tienes pacientes.</p>
          <Link href="/pacientes/nuevo">
            <Button variant="primary" size="md">
              <Plus className="size-4" strokeWidth={2} />
              Vincular paciente
            </Button>
          </Link>
        </div>
      ) : (
        <PacientesListClient rows={rows} />
      )}
    </div>
  );
}

function unwrapOne<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}
