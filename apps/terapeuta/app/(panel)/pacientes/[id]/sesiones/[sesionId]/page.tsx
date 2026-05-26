import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { NotaForm } from './NotaForm';
import { AccionesSesion } from './AccionesSesion';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string; sesionId: string }>;
}

export default async function DetalleSesionPage({ params }: PageProps) {
  const { id, sesionId } = await params;
  const supabase = await createClient();

  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id, numero, fecha_programada, duracion_min, modalidad, link_videollamada, ubicacion, estado, motivo_cancelacion')
    .eq('id', sesionId)
    .maybeSingle();

  if (!sesion) notFound();

  const { data: nota } = await supabase
    .from('sesion_notas')
    .select('id, contenido_publico, contenido_privado, plan_proxima_sesion, visible_paciente')
    .eq('sesion_id', sesionId)
    .maybeSingle();

  const fecha = new Date(sesion.fecha_programada);

  return (
    <div className="px-8 py-10 max-w-4xl">
      <Link
        href={`/pacientes/${id}/sesiones`}
        className="inline-flex items-center gap-1 text-foreground-muted hover:text-ink mb-6 text-sm"
      >
        <ChevronLeft className="size-4" strokeWidth={1.6} />
        Sesiones
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <p className="caption mb-2">
            {sesion.numero ? `Sesión #${sesion.numero}` : 'Sesión'}
          </p>
          <h1 className="font-serif text-4xl text-ink leading-tight mb-2">
            {fecha.toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </h1>
          <p className="text-foreground-muted">
            {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            {' · '}
            {sesion.duracion_min} min · {sesion.modalidad}
          </p>
        </div>
        <AccionesSesion sesion={sesion} vinculacionId={id} />
      </div>

      {sesion.link_videollamada && (
        <Card variant="flat" className="mb-6 bg-noema-sage/10 border-noema-sage/30">
          <a
            href={sesion.link_videollamada}
            target="_blank"
            rel="noopener noreferrer"
            className="text-noema-deep font-medium hover:underline break-all"
          >
            Entrar a la videollamada →
          </a>
        </Card>
      )}

      {sesion.motivo_cancelacion && (
        <Card variant="flat" className="mb-6 bg-[#B85450]/10 border-[#B85450]/30">
          <p className="caption mb-1">Motivo de cancelación</p>
          <p className="text-sm">{sesion.motivo_cancelacion}</p>
        </Card>
      )}

      <NotaForm sesionId={sesionId} vinculacionId={id} initial={nota ?? null} />
    </div>
  );
}
