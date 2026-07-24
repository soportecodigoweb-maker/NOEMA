'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { MessageCircle, X } from 'lucide-react';
import {
  reproducirSonido,
  enNoMolestar,
  type SonidoNotificacion,
} from '@/lib/sonido-notificacion';

interface Aviso {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  url: string | null;
}

/** Preferencias del terapeuta (Ajustes → Mis notificaciones). */
export interface PreferenciasAviso {
  sonido: SonidoNotificacion;
  mensajes: boolean;
  registros: boolean;
  tareas: boolean;
  noMolestarActivo: boolean;
  noMolestarDesde: string;
  noMolestarHasta: string;
}

const POR_DEFECTO: PreferenciasAviso = {
  sonido: 'suave',
  mensajes: true,
  registros: true,
  tareas: true,
  noMolestarActivo: false,
  noMolestarDesde: '21:00',
  noMolestarHasta: '08:00',
};

/** ¿Este tipo de notificación está encendido en los ajustes? */
function tipoActivo(tipo: string, p: PreferenciasAviso): boolean {
  if (tipo === 'mensaje') return p.mensajes;
  if (tipo === 'registro') return p.registros;
  if (tipo === 'tarea_completada') return p.tareas;
  return true; // vinculación y demás: siempre
}

/**
 * Aviso emergente cuando llega una notificación estando en otra pantalla.
 * Complementa la campana: el contador sube y además salta este aviso, para
 * que no se pase por alto un mensaje nuevo.
 *
 * Las alertas de crisis tienen su propio aviso (más prominente), así que aquí
 * se omiten para no duplicar.
 */
export function AvisoNotificacion({
  preferencias = POR_DEFECTO,
}: {
  preferencias?: PreferenciasAviso;
}) {
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const canal = supabase
      .channel('aviso-notificaciones')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const n = payload.new as Aviso;
          if (n.tipo === 'crisis') return; // ya tiene aviso propio

          // Respetar los ajustes: si este tipo está apagado, la notificación
          // igual queda registrada en la campana, pero no salta el aviso.
          if (!tipoActivo(n.tipo, preferencias)) return;

          // No molestar: en ese horario no salta ni suena.
          const silenciado =
            preferencias.noMolestarActivo &&
            enNoMolestar(preferencias.noMolestarDesde, preferencias.noMolestarHasta);
          if (silenciado) return;

          setAvisos((prev) => [n, ...prev].slice(0, 3));
          reproducirSonido(preferencias.sonido);

          // Se oculta solo a los 6 segundos.
          setTimeout(() => {
            setAvisos((prev) => prev.filter((x) => x.id !== n.id));
          }, 6000);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (avisos.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[55] flex w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0"
    >
      {avisos.map((a) => (
        <button
          key={a.id}
          onClick={() => {
            setAvisos((prev) => prev.filter((x) => x.id !== a.id));
            if (a.url) router.push(a.url);
          }}
          className="flex w-full items-start gap-3 rounded-2xl border border-noema-deep/12 bg-white p-3.5 text-left shadow-lg transition-colors hover:border-noema-sage"
        >
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
            <MessageCircle className="size-4 text-noema-sage" strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">{a.titulo}</span>
            {a.cuerpo && (
              <span className="mt-0.5 line-clamp-2 block text-xs text-foreground-muted">
                {a.cuerpo}
              </span>
            )}
          </span>
          <span
            role="button"
            tabIndex={-1}
            aria-label="Descartar"
            onClick={(e) => {
              e.stopPropagation();
              setAvisos((prev) => prev.filter((x) => x.id !== a.id));
            }}
            className="shrink-0 text-foreground-muted hover:text-ink"
          >
            <X className="size-4" />
          </span>
        </button>
      ))}
    </div>
  );
}
