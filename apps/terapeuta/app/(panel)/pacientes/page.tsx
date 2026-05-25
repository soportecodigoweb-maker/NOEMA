import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { tiempoRelativo } from '@/lib/utils';

export const metadata = { title: 'Pacientes' };
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ estado?: string }>;
}

export default async function PacientesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filtro = (params.estado ?? 'activa') as 'activa' | 'pausada' | 'finalizada' | 'todos';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from('vinculaciones')
    .select(
      `
      id,
      estado,
      fecha_inicio,
      actualizado_at,
      codigo_invitacion,
      paciente:profiles!vinculaciones_paciente_id_fkey(id, nombre, avatar_url)
      `,
    )
    .eq('terapeuta_id', user.id)
    .order('actualizado_at', { ascending: false });

  if (filtro !== 'todos') {
    query = query.eq('estado', filtro);
  }

  const { data: vinculaciones } = await query;

  // Conteos para los chips de filtro
  const { data: conteos } = await supabase
    .from('vinculaciones')
    .select('estado')
    .eq('terapeuta_id', user.id);

  const counts = (conteos ?? []).reduce<Record<string, number>>((acc, v) => {
    acc[v.estado] = (acc[v.estado] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl text-ink leading-tight">Pacientes</h1>
          <p className="text-foreground-muted mt-2">
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

      {/* Filtros + búsqueda */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <FiltroChip href="/pacientes?estado=activa" active={filtro === 'activa'}>
          Activos ({counts.activa ?? 0})
        </FiltroChip>
        <FiltroChip href="/pacientes?estado=pausada" active={filtro === 'pausada'}>
          Pausados ({counts.pausada ?? 0})
        </FiltroChip>
        <FiltroChip href="/pacientes?estado=finalizada" active={filtro === 'finalizada'}>
          Finalizados ({counts.finalizada ?? 0})
        </FiltroChip>
        <FiltroChip href="/pacientes?estado=todos" active={filtro === 'todos'}>
          Todos ({(conteos ?? []).length})
        </FiltroChip>
        <div className="flex-1" />
        <div className="relative max-w-xs">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="search"
            placeholder="Buscar paciente"
            className="h-10 pl-9 pr-3 rounded-md border border-noema-deep/10 bg-bone text-sm focus:outline-none focus:border-noema-sage focus:ring-1 focus:ring-noema-sage"
            disabled
          />
        </div>
      </div>

      {/* Lista */}
      {!vinculaciones || vinculaciones.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-foreground-muted mb-6">
            {filtro === 'activa'
              ? 'Aún no tienes pacientes activos.'
              : 'No hay pacientes en este filtro.'}
          </p>
          {filtro === 'activa' && (
            <Link href="/pacientes/nuevo">
              <Button variant="primary" size="md">
                <Plus className="size-4" strokeWidth={2} />
                Vincular paciente
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <Card variant="flat" className="overflow-hidden p-0">
          <ul className="divide-y divide-noema-deep/[0.06]">
            {vinculaciones.map((v: any) => (
              <li key={v.id}>
                <Link
                  href={`/pacientes/${v.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-paper/40 transition-colors"
                >
                  <div className="size-11 rounded-full bg-noema-sage/15 flex items-center justify-center text-noema-deep/70 text-sm font-medium shrink-0">
                    {v.paciente
                      ? initials(v.paciente.nombre)
                      : '⌛'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">
                      {v.paciente?.nombre ?? `Invitación pendiente · ${v.codigo_invitacion}`}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {v.fecha_inicio
                        ? `Vinculado desde ${new Date(v.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : 'Esperando que el paciente introduzca el código'}
                    </p>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    {tiempoRelativo(v.actualizado_at)}
                  </p>
                  <EstadoBadge estado={v.estado} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function FiltroChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
        active
          ? 'bg-noema-deep text-bone'
          : 'bg-bone text-foreground-muted hover:text-ink border border-noema-deep/10'
      }`}
    >
      {children}
    </Link>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string }> = {
    activa: { label: 'Activo', color: 'bg-emotion-tranquilo/40 text-ink/70' },
    pausada: { label: 'Pausado', color: 'bg-emotion-ansioso/30 text-ink/70' },
    finalizada: { label: 'Finalizado', color: 'bg-noema-deep/10 text-ink/60' },
    pendiente: { label: 'Pendiente', color: 'bg-emotion-cansado/30 text-ink/70' },
    archivada: { label: 'Archivado', color: 'bg-noema-deep/10 text-ink/50' },
  };
  const v = map[estado] ?? map.activa!;
  return (
    <span className={`caption px-2 py-1 rounded ${v.color}`}>{v.label}</span>
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
