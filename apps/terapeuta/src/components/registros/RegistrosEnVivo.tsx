'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, X, Send } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface RegistroVivo {
  id: string;
  paciente_id: string;
  emocion_principal_key: string;
  intensidad: number;
  descripcion: string | null;
  registrado_at: string;
  nombre?: string;
  vinculacionId?: string | null;
}

/**
 * Registros emocionales en vivo (#6). El terapeuta ve llegar el registro en el
 * momento y puede responderle al paciente de inmediato (el hilo trae los
 * mensajes rápidos configurados por paciente, #7).
 *
 * Privacidad: la RLS solo emite registros que el paciente compartió o marcó
 * para sesión — los privados nunca llegan aquí.
 */
export function RegistrosEnVivo() {
  const [registros, setRegistros] = useState<RegistroVivo[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const canal = supabase
      .channel('registros-en-vivo-terapeuta')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'registros_emocionales' },
        async (payload) => {
          const r = payload.new as RegistroVivo;

          // Resolver nombre del paciente y su vinculación para poder responder.
          const [{ data: perfil }, { data: vinc }] = await Promise.all([
            supabase.from('profiles').select('nombre').eq('id', r.paciente_id).maybeSingle(),
            supabase
              .from('vinculaciones')
              .select('id')
              .eq('paciente_id', r.paciente_id)
              .eq('estado', 'activa')
              .maybeSingle(),
          ]);

          setRegistros((prev) =>
            prev.some((x) => x.id === r.id)
              ? prev
              : [
                  {
                    ...r,
                    nombre: perfil?.nombre ?? 'Paciente',
                    vinculacionId: vinc?.id ?? null,
                  },
                  ...prev,
                ].slice(0, 3),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (registros.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[55] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {registros.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl border border-noema-sage/40 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
              <Activity className="size-5 text-noema-sage" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-noema-sage">
                Registro en vivo
              </p>
              <p className="font-serif text-base leading-tight text-ink">
                {r.nombre} · {r.emocion_principal_key?.replace(/_/g, ' ')}{' '}
                <span className="text-foreground-muted">({r.intensidad}/5)</span>
              </p>
              {r.descripcion && (
                <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">
                  {r.descripcion}
                </p>
              )}
              {r.vinculacionId && (
                <Link
                  href={`/mensajes/${r.vinculacionId}`}
                  onClick={() => setRegistros((p) => p.filter((x) => x.id !== r.id))}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-noema-sage px-3 py-1.5 text-xs font-medium text-bone hover:bg-noema-sage/90"
                >
                  <Send className="size-3.5" strokeWidth={1.9} />
                  Responder ahora
                </Link>
              )}
            </div>
            <button
              onClick={() => setRegistros((p) => p.filter((x) => x.id !== r.id))}
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
