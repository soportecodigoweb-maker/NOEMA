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
      paciente_id
      `,
    )
    .eq('terapeuta_id', user.id)
    .order('actualizado_at', { ascending: false });

  // El FK vinculaciones.paciente_id → pacientes(profile_id), y el nombre vive
  // en profiles. Traemos los perfiles por separado y los mapeamos por id
  // (paciente_id === profiles.id).
  const pacienteIds = (vinculaciones ?? [])
    .map((v) => v.paciente_id)
    .filter((id): id is string => Boolean(id));

  const perfilPorId = new Map<
    string,
    { id: string; nombre: string; avatar_url: string | null }
  >();
  if (pacienteIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, nombre, avatar_url')
      .in('id', pacienteIds);
    for (const p of perfiles ?? []) perfilPorId.set(p.id, p);
  }

  const rows: VinculacionRow[] = (vinculaciones ?? []).map((v) => ({
    id: v.id,
    estado: v.estado,
    fecha_inicio: v.fecha_inicio,
    actualizado_at: v.actualizado_at,
    codigo_invitacion: v.codigo_invitacion,
    nivel_riesgo: v.nivel_riesgo,
    sos_habilitado: v.sos_habilitado,
    paciente: v.paciente_id ? perfilPorId.get(v.paciente_id) ?? null : null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
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
