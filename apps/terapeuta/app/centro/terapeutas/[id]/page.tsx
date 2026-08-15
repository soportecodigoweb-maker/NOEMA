import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { detalleTerapeuta } from '../../data';
import { PacientesTerapeuta } from '@/components/centro/PacientesTerapeuta';
import { GestionTerapeuta } from '@/components/centro/GestionTerapeuta';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TerapeutaDetallePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const detalle = await detalleTerapeuta(user.id, id);
  if (!detalle) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/centro/terapeutas"
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" /> Terapeutas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl text-ink">{detalle.nombre}</h1>
            {detalle.estado === 'inactiva' && (
              <span className="rounded bg-emotion-cansado/30 px-2 py-0.5 text-[11px] text-ink/70">Suspendido</span>
            )}
          </div>
          <p className="text-sm text-foreground-muted">
            {detalle.pacientes.length} paciente{detalle.pacientes.length === 1 ? '' : 's'} en total.
          </p>
        </div>
        <GestionTerapeuta terapeutaId={id} estado={detalle.estado} />
      </div>

      <PacientesTerapeuta pacientes={detalle.pacientes} otrosTerapeutas={detalle.otrosTerapeutas} />

      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-4 text-sm text-foreground-muted">
        <Eye className="mt-0.5 size-4 shrink-0 text-noema-sage" />
        <p>
          La <span className="font-medium text-ink">supervisión clínica</span> (ver el proceso de cada
          paciente con autorización del terapeuta) se activará desde la sección Supervisión.
        </p>
      </div>
    </div>
  );
}
