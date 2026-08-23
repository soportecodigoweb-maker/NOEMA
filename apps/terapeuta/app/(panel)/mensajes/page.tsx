import Link from 'next/link';
import { MessageCircle, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { tiempoRelativo } from '@/lib/utils';
import { perfilesPorId } from '@/lib/perfiles-lookup';

export const metadata = { title: 'Mensajes' };
export const dynamic = 'force-dynamic';

export default async function MensajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Todas las vinculaciones activas con sus últimos mensajes
  const { data: vincs } = await supabase
    .from('vinculaciones')
    .select('id, paciente_id')
    .eq('terapeuta_id', user.id)
    .eq('estado', 'activa');

  // El FK apunta a pacientes; resolvemos perfiles por id.
  const perfiles = await perfilesPorId(
    supabase,
    (vincs ?? []).map((v) => v.paciente_id),
  );
  const lista = (vincs ?? []).map((v) => ({
    id: v.id,
    paciente: v.paciente_id ? perfiles.get(v.paciente_id) ?? null : null,
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

  // Conversación con el centro terapéutico (si pertenece a uno).
  const { data: membresiaCentro } = await supabase
    .from('centro_terapeutas')
    .select('centro_id')
    .eq('terapeuta_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();
  let chatCentro: { nombre: string; ultimo: string | null; fecha: string | null; noLeidos: number } | null = null;
  if (membresiaCentro) {
    const [{ data: c }, { data: ult }, { count: sinLeer }] = await Promise.all([
      supabase.from('centros').select('nombre_centro').eq('profile_id', membresiaCentro.centro_id).maybeSingle(),
      supabase
        .from('centro_mensajes')
        .select('cuerpo, creado_at')
        .eq('terapeuta_id', user.id)
        .order('creado_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('centro_mensajes')
        .select('*', { count: 'exact', head: true })
        .eq('terapeuta_id', user.id)
        .eq('de_centro', true)
        .is('leido_at', null),
    ]);
    chatCentro = {
      nombre: c?.nombre_centro ?? 'Tu centro',
      ultimo: ult?.cuerpo ?? null,
      fecha: ult?.creado_at ?? null,
      noLeidos: sinLeer ?? 0,
    };
  }

  // Ordenar: con mensajes primero, los más recientes arriba
  conversaciones.sort((a, b) => {
    if (!a.ultimo && !b.ultimo) return 0;
    if (!a.ultimo) return 1;
    if (!b.ultimo) return -1;
    return new Date(b.ultimo.creado_at).getTime() - new Date(a.ultimo.creado_at).getTime();
  });

  return (
    <div className="px-5 py-8 sm:px-8 sm:py-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-ink leading-tight mb-2">Mensajes</h1>
        <p className="text-foreground-muted">
          Comunicación asíncrona con tus pacientes. No es chat 24/7.
        </p>
      </div>

      {/* Conversación con el centro terapéutico */}
      {chatCentro && (
        <Card variant="flat" className="mb-4 overflow-hidden p-0">
          <Link
            href="/mi-centro"
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper/40"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/20 text-noema-deep/70">
              <Building2 className="size-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <p className="truncate font-medium text-ink">{chatCentro.nombre}</p>
                <span className="shrink-0 rounded bg-noema-sage/12 px-1.5 py-0.5 text-[10px] text-noema-sage">
                  Centro
                </span>
                {chatCentro.fecha && (
                  <span className="shrink-0 text-xs text-foreground-muted">
                    · {tiempoRelativo(chatCentro.fecha)}
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-foreground-muted">
                {chatCentro.ultimo ?? 'Escríbele a la administración de tu centro'}
              </p>
            </div>
            {chatCentro.noLeidos > 0 && (
              <span className="shrink-0 rounded-full bg-noema-clay px-2 py-0.5 text-xs font-medium text-white">
                {chatCentro.noLeidos}
              </span>
            )}
          </Link>
        </Card>
      )}

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
