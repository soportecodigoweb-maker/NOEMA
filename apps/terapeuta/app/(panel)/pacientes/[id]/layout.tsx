import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TabsNav } from '@/components/pacientes/TabsNav';
import { ConfigVinculacion } from '@/components/pacientes/ConfigVinculacion';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function PacienteLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select(
      `
      id,
      estado,
      fecha_inicio,
      nivel_riesgo,
      sos_habilitado,
      agenda_habilitada,
      paciente:profiles!vinculaciones_paciente_id_fkey(id, nombre, avatar_url)
      `,
    )
    .eq('id', id)
    .single();

  if (!vinc) notFound();

  const paciente = unwrapOne(vinc.paciente);

  return (
    <div>
      {/* Cabecera del paciente */}
      <div className="px-8 pt-10 pb-6 border-b border-noema-deep/[0.06]">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-foreground-muted hover:text-ink mb-4 text-sm"
        >
          <ChevronLeft className="size-4" strokeWidth={1.6} />
          Pacientes
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-noema-sage/15 font-medium text-noema-deep/70">
              {paciente ? initials(paciente.nombre) : '⌛'}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h1 className="font-serif text-3xl text-ink">
                  {paciente?.nombre ?? 'Invitación pendiente'}
                </h1>
                <EstadoBadge estado={vinc.estado} />
              </div>
              <p className="text-sm text-foreground-muted">
                {vinc.fecha_inicio
                  ? `Desde ${new Date(vinc.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Esperando que el paciente acepte la vinculación'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/mensajes/${vinc.id}`}
              className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-noema-deep/30"
            >
              <MessageCircle className="size-4" strokeWidth={1.8} />
              Enviar mensaje
            </Link>
            <ConfigVinculacion
              vinculacionId={vinc.id}
              nivelRiesgo={vinc.nivel_riesgo}
              sosHabilitado={vinc.sos_habilitado}
              agendaHabilitada={vinc.agenda_habilitada}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <TabsNav vinculacionId={vinc.id} />
        </div>
      </div>

      {/* Contenido del tab */}
      <div className="px-8 py-8 max-w-6xl">{children}</div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

function unwrapOne<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null;
  return x ?? null;
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string }> = {
    activa: { label: 'Paciente activo', color: 'bg-emotion-tranquilo/40 text-ink/70' },
    pausada: { label: 'Pausado', color: 'bg-emotion-ansioso/30 text-ink/70' },
    finalizada: { label: 'Finalizado', color: 'bg-noema-deep/10 text-ink/60' },
    pendiente: { label: 'Invitación pendiente', color: 'bg-emotion-cansado/30 text-ink/70' },
  };
  const v = map[estado] ?? map.activa!;
  return (
    <span className={`caption px-2 py-1 rounded ${v.color}`}>{v.label}</span>
  );
}
