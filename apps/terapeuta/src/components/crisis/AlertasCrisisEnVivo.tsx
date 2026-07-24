'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface AlertaViva {
  id: string;
  vinculacion_id: string | null;
  paciente_id: string;
  contexto: string | null;
  creada_at: string;
  nombre?: string;
}

/**
 * Aviso en vivo de alertas de crisis (#4). Se suscribe a `alertas_crisis` vía
 * Realtime; la RLS (alertas_crisis_terapeuta_notificado) hace que solo lleguen
 * las alertas de sus pacientes que autorizaron el aviso.
 */
export function AlertasCrisisEnVivo({
  habilitado = true,
}: {
  /** Ajustes → Mis notificaciones → Alertas de crisis. */
  habilitado?: boolean;
}) {
  const [alertas, setAlertas] = useState<AlertaViva[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    // El terapeuta puede apagarlas en Ajustes (la alerta igual queda registrada
    // en la campana). El "no molestar" NO aplica aquí: una crisis siempre pasa.
    if (!habilitado) return;

    const canal = supabase
      .channel('alertas-crisis-terapeuta')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertas_crisis' },
        async (payload) => {
          const a = payload.new as AlertaViva;
          // Resolver el nombre del paciente para mostrarlo en el aviso.
          const { data: perfil } = await supabase
            .from('profiles')
            .select('nombre')
            .eq('id', a.paciente_id)
            .maybeSingle();
          setAlertas((prev) =>
            prev.some((x) => x.id === a.id)
              ? prev
              : [{ ...a, nombre: perfil?.nombre ?? 'Un paciente' }, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habilitado]);

  if (alertas.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {alertas.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-noema-clay/40 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-noema-clay/15">
              <LifeBuoy className="size-5 text-noema-clay" strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-noema-clay">
                Alerta de apoyo
              </p>
              <p className="font-serif text-lg leading-tight text-ink">
                {a.nombre} pidió apoyo
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                {new Date(a.creada_at).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Mexico_City',
                })}
                {a.contexto ? ` · ${a.contexto}` : ''}
              </p>
              {a.vinculacion_id && (
                <Link
                  href={`/mensajes/${a.vinculacion_id}`}
                  onClick={() => setAlertas((p) => p.filter((x) => x.id !== a.id))}
                  className="mt-2 inline-block rounded-md bg-noema-clay px-3 py-1.5 text-xs font-medium text-white hover:bg-noema-clay/90"
                >
                  Responder ahora
                </Link>
              )}
            </div>
            <button
              onClick={() => setAlertas((p) => p.filter((x) => x.id !== a.id))}
              aria-label="Descartar"
              className="text-foreground-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
