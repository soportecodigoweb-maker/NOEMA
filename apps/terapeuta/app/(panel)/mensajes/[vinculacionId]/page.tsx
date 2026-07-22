import Link from 'next/link';
import { ChevronLeft, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MarkAsRead } from './MarkAsRead';
import { HiloTerapeuta } from './HiloTerapeuta';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ vinculacionId: string }>;
}

interface Mensaje {
  id: string;
  contenido: string;
  autor_id: string;
  creado_at: string;
  leido_at: string | null;
}

export default async function ThreadPage({ params }: PageProps) {
  const { vinculacionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, paciente_id')
    .eq('id', vinculacionId)
    .single();

  if (!vinc) notFound();

  const { data: paciente } = vinc.paciente_id
    ? await supabase
        .from('profiles')
        .select('id, nombre')
        .eq('id', vinc.paciente_id)
        .maybeSingle()
    : { data: null };

  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('id, contenido, autor_id, creado_at, leido_at')
    .eq('vinculacion_id', vinculacionId)
    .order('creado_at', { ascending: true });

  // Mensajes rápidos: los de este paciente + los generales del terapeuta (#7)
  const { data: rapidos } = await supabase
    .from('mensajes_rapidos')
    .select('id, texto, vinculacion_id')
    .eq('terapeuta_id', user.id)
    .or(`vinculacion_id.eq.${vinculacionId},vinculacion_id.is.null`)
    .order('orden', { ascending: true });

  const lista = (mensajes as Mensaje[] | null) ?? [];

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-noema-deep/[0.06] px-5 py-5 sm:px-8">
        <Link href="/mensajes" className="text-foreground-muted hover:text-ink">
          <ChevronLeft className="size-5" strokeWidth={1.6} />
        </Link>
        <div className="flex size-10 items-center justify-center rounded-full bg-noema-sage/15 text-sm font-medium text-noema-deep/70">
          {paciente ? initials(paciente.nombre) : <User className="size-4" />}
        </div>
        <div>
          <p className="font-medium text-ink">{paciente?.nombre ?? 'Paciente'}</p>
          <p className="text-xs text-foreground-muted">Conversación en tiempo real</p>
        </div>
      </div>

      {/* Auto-marca como leídos al entrar */}
      <MarkAsRead vinculacionId={vinculacionId} />

      <HiloTerapeuta
        vinculacionId={vinculacionId}
        userId={user.id}
        mensajesIniciales={lista}
        rapidos={rapidos ?? []}
      />
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
