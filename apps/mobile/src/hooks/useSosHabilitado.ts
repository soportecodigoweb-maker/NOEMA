import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Indica si el botón S.O.S. está habilitado para el paciente actual
 * (requerimiento #9 — el terapeuta puede prenderlo/apagarlo por paciente).
 *
 * Estrategia: cachea el valor a nivel de módulo para no consultar en cada
 * pantalla donde se monta el CrisisButton. El default es `true` (seguridad:
 * ante la duda, el paciente conserva su vía de apoyo).
 */
let cache: { userId: string; value: boolean } | null = null;

export function useSosHabilitado(): boolean {
  const { user } = useAuth();
  const [habilitado, setHabilitado] = useState<boolean>(
    cache && user && cache.userId === user.id ? cache.value : true,
  );

  useEffect(() => {
    if (!user) return;
    if (cache && cache.userId === user.id) {
      setHabilitado(cache.value);
      return;
    }

    let cancelado = false;
    (async () => {
      const { data } = await supabase
        .from('vinculaciones')
        .select('sos_habilitado')
        .eq('paciente_id', user.id)
        .eq('estado', 'activa')
        .maybeSingle();

      // Sin vinculación activa → conserva el botón (paciente sin terapeuta
      // aún puede acceder a líneas de crisis públicas).
      const value = data ? data.sos_habilitado !== false : true;
      cache = { userId: user.id, value };
      if (!cancelado) setHabilitado(value);
    })();

    return () => {
      cancelado = true;
    };
  }, [user]);

  return habilitado;
}

/** Limpia el caché (llamar tras cambiar de sesión). */
export function invalidarSosCache() {
  cache = null;
}
