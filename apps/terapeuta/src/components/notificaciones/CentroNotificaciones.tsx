'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Bell,
  MessageCircle,
  Activity,
  LifeBuoy,
  ClipboardCheck,
  Link2,
  BookOpen,
  Check,
} from 'lucide-react';
import { tiempoRelativo } from '@/lib/utils';

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  url: string | null;
  leida_at: string | null;
  creada_at: string;
}

/**
 * Campana de notificaciones con panel desplegable.
 * Se alimenta de la tabla `notificaciones` (que llenan los triggers) y escucha
 * Realtime, así que el contador sube en el momento en que ocurre el evento.
 */
export function CentroNotificaciones({
  inicialesNoLeidas = 0,
  tono = 'claro',
}: {
  inicialesNoLeidas?: number;
  /** 'oscuro' para el menú lateral (fondo verde), 'claro' para cabeceras. */
  tono?: 'claro' | 'oscuro';
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(inicialesNoLeidas);
  const [cargando, setCargando] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from('notificaciones')
      .select('id, tipo, titulo, cuerpo, url, leida_at, creada_at')
      .order('creada_at', { ascending: false })
      .limit(30);
    setItems((data as Notificacion[] | null) ?? []);
    setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contador inicial + suscripción en tiempo real.
  useEffect(() => {
    const contar = async () => {
      const { count } = await supabase
        .from('notificaciones')
        .select('*', { count: 'exact', head: true })
        .is('leida_at', null);
      setNoLeidas(count ?? 0);
    };
    contar();

    const canal = supabase
      .channel('notificaciones-centro')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const n = payload.new as Notificacion;
          setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
          setNoLeidas((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  const alternar = () => {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo) cargar();
  };

  const marcarTodas = async () => {
    const ahora = new Date().toISOString();
    await supabase.from('notificaciones').update({ leida_at: ahora }).is('leida_at', null);
    setItems((prev) => prev.map((n) => ({ ...n, leida_at: n.leida_at ?? ahora })));
    setNoLeidas(0);
  };

  const abrirNotificacion = async (n: Notificacion) => {
    if (!n.leida_at) {
      await supabase
        .from('notificaciones')
        .update({ leida_at: new Date().toISOString() })
        .eq('id', n.id);
      setNoLeidas((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, leida_at: new Date().toISOString() } : x)),
      );
    }
    setAbierto(false);
    if (n.url) router.push(n.url);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={alternar}
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
        className={`relative flex size-10 items-center justify-center rounded-md ${
          tono === 'oscuro'
            ? 'text-bone/70 hover:bg-bone/10 hover:text-bone'
            : 'text-noema-deep/70 hover:bg-bone hover:text-noema-deep'
        }`}
      >
        <Bell size={18} strokeWidth={1.6} />
        {noLeidas > 0 && (
          <span className="absolute right-1 top-1 flex min-w-[1.15rem] items-center justify-center rounded-full bg-noema-clay px-1 text-[10px] font-semibold leading-4 text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className={`absolute z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-noema-deep/10 bg-white shadow-xl ${
            // En el menú lateral se despliega hacia el contenido (no se sale de pantalla).
            tono === 'oscuro' ? 'left-0' : 'right-0'
          }`}
        >
          <div className="flex items-center justify-between border-b border-noema-deep/8 px-4 py-2.5">
            <p className="font-serif text-base text-ink">Notificaciones</p>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                className="inline-flex items-center gap-1 text-xs text-noema-sage hover:underline"
              >
                <Check className="size-3.5" strokeWidth={2} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {cargando && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-foreground-muted">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-foreground-muted">
                No tienes notificaciones todavía.
              </p>
            ) : (
              <ul className="divide-y divide-noema-deep/[0.06]">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => abrirNotificacion(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-bone/60 ${
                        n.leida_at ? '' : 'bg-noema-sage/[0.06]'
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        <IconoTipo tipo={n.tipo} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{n.titulo}</span>
                        {n.cuerpo && (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-foreground-muted">
                            {n.cuerpo}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-foreground-muted">
                          {tiempoRelativo(n.creada_at)}
                        </span>
                      </span>
                      {!n.leida_at && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-noema-clay" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IconoTipo({ tipo }: { tipo: string }) {
  const cls = 'size-4';
  if (tipo === 'mensaje')
    return <MessageCircle className={`${cls} text-noema-sage`} strokeWidth={1.8} />;
  if (tipo === 'registro')
    return <Activity className={`${cls} text-noema-sage`} strokeWidth={1.8} />;
  if (tipo === 'diario')
    return <BookOpen className={`${cls} text-noema-sage`} strokeWidth={1.8} />;
  if (tipo === 'crisis')
    return <LifeBuoy className={`${cls} text-noema-clay`} strokeWidth={1.9} />;
  if (tipo === 'tarea_completada')
    return <ClipboardCheck className={`${cls} text-emerald-600`} strokeWidth={1.8} />;
  return <Link2 className={`${cls} text-noema-sage`} strokeWidth={1.8} />;
}
