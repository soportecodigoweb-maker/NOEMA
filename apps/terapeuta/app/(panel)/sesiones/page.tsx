import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { perfilesPorId } from '@/lib/perfiles-lookup';
import { NuevaSesion, type PacienteOption } from '@/components/sesiones/NuevaSesion';
import { VistaSesiones } from '@/components/sesiones/VistaSesiones';
import { RefrescarEnVivo } from '@/components/util/RefrescarEnVivo';
import type { SesionCal } from '@/components/sesiones/CalendarioSesiones';

export const metadata = { title: 'Sesiones' };
export const dynamic = 'force-dynamic';

export default async function SesionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Sesiones de TODAS las vinculaciones del terapeuta
  const { data: vincs } = await supabase
    .from('vinculaciones')
    .select('id, paciente_id')
    .eq('terapeuta_id', user.id);

  const vincIds = (vincs ?? []).map((v) => v.id);

  // Mapa vinculacion_id → perfil del paciente (el FK apunta a pacientes).
  const perfiles = await perfilesPorId(
    supabase,
    (vincs ?? []).map((v) => v.paciente_id),
  );
  const pacientePorVinc = new Map<string, { nombre: string } | null>();
  for (const v of vincs ?? []) {
    pacientePorVinc.set(v.id, v.paciente_id ? perfiles.get(v.paciente_id) ?? null : null);
  }

  // Opciones para el formulario de agendar (solo vinculaciones activas con paciente)
  const opcionesPaciente: PacienteOption[] = (vincs ?? [])
    .filter((v) => v.paciente_id && perfiles.get(v.paciente_id))
    .map((v) => ({
      vinculacionId: v.id,
      nombre: perfiles.get(v.paciente_id as string)?.nombre ?? 'Paciente',
    }));

  if (vincIds.length === 0) {
    return (
      <div className="px-5 py-8 sm:px-8 sm:py-10 max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl text-ink mb-2">Sesiones</h1>
        <p className="text-foreground-muted mb-8">
          Aquí verás todas tus sesiones programadas y realizadas.
        </p>
        <Card variant="flat" className="text-center py-16">
          <p className="text-foreground-muted">
            Cuando vincules pacientes y programes sesiones, aparecerán aquí.
          </p>
        </Card>
      </div>
    );
  }

  const { data: sesiones } = await supabase
    .from('sesiones')
    .select('id, fecha_programada, duracion_min, modalidad, estado, vinculacion_id')
    .in('vinculacion_id', vincIds)
    .order('fecha_programada', { ascending: true });

  const sesionesCal: SesionCal[] = (sesiones ?? []).map((s) => ({
    id: s.id,
    vinculacionId: s.vinculacion_id,
    paciente: pacientePorVinc.get(s.vinculacion_id)?.nombre ?? 'Paciente',
    fecha: s.fecha_programada,
    duracion: s.duracion_min,
    modalidad: s.modalidad,
    estado: s.estado,
  }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <RefrescarEnVivo tabla="sesiones" canal="sesiones-terapeuta" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-serif text-4xl leading-tight text-ink">Sesiones</h1>
          <p className="text-foreground-muted">
            Toda tu agenda en un calendario, para planear la semana de un vistazo.
          </p>
        </div>
        <NuevaSesion pacientes={opcionesPaciente} />
      </div>

      <VistaSesiones sesiones={sesionesCal} />
    </div>
  );
}
