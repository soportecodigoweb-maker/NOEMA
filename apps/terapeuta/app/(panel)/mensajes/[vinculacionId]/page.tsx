import Link from 'next/link';
import { ChevronLeft, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Composer } from './Composer';
import { MarkAsRead } from './MarkAsRead';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ vinculacionId: string }>;
}

interface Mensaje {
  id: string;
  contenido: string;
  autor_id: string;
  es_sistema: boolean;
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
    .select(`
      id,
      paciente:profiles!vinculaciones_paciente_id_fkey(id, nombre)
    `)
    .eq('id', vinculacionId)
    .single();

  if (!vinc) notFound();
  const paciente = (vinc as any).paciente as { id: string; nombre: string } | null;

  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('id, contenido, autor_id, es_sistema, creado_at, leido_at')
    .eq('vinculacion_id', vinculacionId)
    .order('creado_at', { ascending: true });

  const lista = (mensajes as Mensaje[] | null) ?? [];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-5 border-b border-noema-deep/[0.06] flex items-center gap-4">
        <Link
          href="/mensajes"
          className="text-foreground-muted hover:text-ink"
        >
          <ChevronLeft className="size-5" strokeWidth={1.6} />
        </Link>
        <div className="size-10 rounded-full bg-noema-sage/15 flex items-center justify-center text-noema-deep/70 text-sm font-medium">
          {paciente ? initials(paciente.nombre) : <User className="size-4" />}
        </div>
        <div>
          <p className="font-medium text-ink">{paciente?.nombre ?? 'Paciente'}</p>
          <p className="text-xs text-foreground-muted">Conversación asíncrona</p>
        </div>
      </div>

      {/* Auto-marca como leídos al entrar */}
      <MarkAsRead vinculacionId={vinculacionId} />

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto w-full">
        {lista.length === 0 ? (
          <Card variant="flat" className="text-center py-12">
            <p className="text-foreground-muted">Aún no hay mensajes. Escribe el primero.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {lista.map((m) => {
              const mio = m.autor_id === user.id;
              return (
                <li key={m.id} className={mio ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      mio
                        ? 'bg-noema-sage text-bone rounded-br-sm'
                        : 'bg-bone text-ink rounded-bl-sm border border-noema-deep/[0.06]'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {m.contenido}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        mio ? 'text-bone/60' : 'text-foreground-muted'
                      }`}
                    >
                      {new Date(m.creado_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-noema-deep/[0.06] p-4 bg-paper">
        <div className="max-w-3xl mx-auto">
          <Composer vinculacionId={vinculacionId} />
        </div>
      </div>
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
