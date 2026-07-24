'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Escucha cambios en tiempo real de una tabla (opcionalmente filtrada) y
 * refresca los datos del servidor de la página actual (router.refresh()).
 *
 * Es la forma más simple de tener "tiempo real" en páginas renderizadas en el
 * servidor: no duplica la lógica de consulta en el cliente; solo pide a Next
 * que vuelva a traer los datos cuando algo cambió.
 */
export function RefrescarEnVivo({
  tabla,
  filtro,
  canal,
}: {
  tabla: string;
  /** Ej. "vinculacion_id=eq.<uuid>". Si se omite, escucha toda la tabla. */
  filtro?: string;
  /** Nombre único del canal (evita choques si hay varios en la página). */
  canal: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    let pendiente: ReturnType<typeof setTimeout> | null = null;
    const refrescar = () => {
      // Pequeño debounce: si llegan varios cambios juntos, un solo refresh.
      if (pendiente) clearTimeout(pendiente);
      pendiente = setTimeout(() => router.refresh(), 250);
    };

    const suscripcion = supabase
      .channel(canal)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tabla, ...(filtro ? { filter: filtro } : {}) },
        refrescar,
      )
      .subscribe();

    return () => {
      if (pendiente) clearTimeout(pendiente);
      supabase.removeChannel(suscripcion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla, filtro, canal]);

  return null;
}
