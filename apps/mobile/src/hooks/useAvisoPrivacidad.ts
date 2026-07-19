import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { VERSION_AVISO_PACIENTE } from '@/lib/aviso-privacidad';

export type EstadoAviso = 'checking' | 'accepted' | 'pending';

/**
 * Indica si el paciente ya aceptó el aviso de privacidad vigente (requerimiento
 * #9). Se muestra al primer uso de la app. Cachea el resultado a nivel módulo
 * para no consultar en cada render del AuthGate.
 */
let cache: { userId: string; estado: EstadoAviso } | null = null;

export function useAvisoPrivacidad(userId: string | null | undefined): EstadoAviso {
  const [estado, setEstado] = useState<EstadoAviso>(() => {
    if (!userId) return 'checking';
    if (cache && cache.userId === userId) return cache.estado;
    return 'checking';
  });

  useEffect(() => {
    if (!userId) return;
    if (cache && cache.userId === userId && cache.estado !== 'checking') {
      setEstado(cache.estado);
      return;
    }

    let cancelado = false;
    (async () => {
      const { data } = await supabase
        .from('consentimientos')
        .select('id')
        .eq('profile_id', userId)
        .eq('tipo', 'aviso_privacidad')
        .eq('version', VERSION_AVISO_PACIENTE)
        .eq('aceptado', true)
        .limit(1)
        .maybeSingle();

      const nuevoEstado: EstadoAviso = data ? 'accepted' : 'pending';
      cache = { userId, estado: nuevoEstado };
      if (!cancelado) setEstado(nuevoEstado);
    })();

    return () => {
      cancelado = true;
    };
  }, [userId]);

  return estado;
}

/** Marca el aviso como aceptado en el caché (tras registrar en DB). */
export function marcarAvisoAceptado(userId: string) {
  cache = { userId, estado: 'accepted' };
}
