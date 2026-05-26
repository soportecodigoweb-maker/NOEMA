import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { tiempoRelativo } from '@/lib/utils';

export const metadata = { title: 'Mensajes' };
export const dynamic = 'force-dynamic';

export default async function MensajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Todas las vinculaciones activas con sus últimos mensajes
  const { data: vincs } = await supabase
    .from('vinculaciones')
    .select(`
      id,
      paciente:profiles!vinculaciones_paciente_id_fkey(nombre, avatar_url)
    `)
    .eq('terapeuta_id', user.id)
    .eq('estado', 'activa');

  // Supabase devuelve `paciente` como array (por la relación FK). Normalizamos.
  const lista = ((vincs ?? []) as any[]).map((v) => ({
    id: v.id as string,
    paciente: (Array.isArray(v.paciente) ? v.paciente[0] : v.paciente) as
      | { nombre: string; avatar_url: string | null }
      | null,
  }));

  // Para cada vinculación, último mensaje + count no leídos por el terapeuta
  const conversaciones = await Promise.all(
    lista.map(async (v) => {
      const [{ data: ultimo }, { count: noLeidos }] = await Promise.all([
        supabase
          .from('mensajes')
          .select('contenido, autor_id, creado_at')
          .eq('vinculacion_id', v.id)
          .order('creado_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('mensajes')
          .select('*', { count: 'exact', head: true })
          .eq('vinculacion_id', v.id)
          .is('leido_at', null)
          .neq('autor_id', user.id),
      ]);
      return {
        vinc: v,
        ultimo: ultimo as { contenido: string; autor_id: string; creado_at: string } | null,
        noLeidos: noLeidos ?? 0,
      };
    }),
  );

  // Ordenar: con mensajes primero, los más recientes arriba
  conversaciones.sort((a, b) => {
    if (!a.ultimo && !b.ultimo) return 0;
    if (!a.ultimo) return 1;
    if (!b.ultimo) return -1;
    return new Date(b.ultimo.creado_at).getTime() - new Date(a.ultimo.creado_at).getTime();
  });

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Mensajes</h1>
        <p className="text-foreground-muted">
          Comunicación asíncrona con tus pacientes. No es chat 24/7.
        </p>
      </div>

      {conversaciones.length === 0 ? (
        <Card variant="flat" className="text-center py-16">
          <MessageCircle className="size-8 text-foreground-muted mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-foreground-muted">
            Cuando tengas pacientes activos, podrás escribirles aquí.
          </p>
        </Card>
      ) : (
        <Card variant="flat" className="p-0 overflow-hidden">
          <ul className="divide-y divide-noema-deep/[0.06]">
            {conversaciones.map((c) => {
              if (!c.vinc.paciente) return null;
              const mio = c.ultimo?.autor_id === user.id;
              return (
                <li key={c.vinc.id}>
                  <Link
                    href={`/mensajes/${c.vinc.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-paper/40 transition-colors"
                  >
                    <div className="size-11 rounded-full bg-noema-sage/15 flex items-center justify-center text-noema-deep/70 text-sm font-medium shrink-0">
                      {initials(c.vinc.paciente.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-ink truncate">
                          {c.vinc.paciente.nombre}
                        </p>
                        {c.ultimo && (
                          <span className="text-xs text-foreground-muted shrink-0">
                            · {tiempoRelativo(c.ultimo.creado_at)}
                          </span>
                        )}
                      </div>
                      {c.ultimo ? (
                        <p className="text-sm text-foreground-muted truncate">
                          {mio && <span className="text-noema-sage">Tú: </span>}
                          {c.ultimo.contenido}
                        </p>
                      ) : (
                        <p className="text-sm text-foreground-muted italic">
                          Sin mensajes aún. Tú escribes el primero.
                        </p>
                      )}
                    </div>
                    {c.noLeidos > 0 && (
                      <span className="size-6 rounded-full bg-noema-sage text-bone text-xs font-medium flex items-center justify-center shrink-0">
                        {c.noLeidos}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
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
