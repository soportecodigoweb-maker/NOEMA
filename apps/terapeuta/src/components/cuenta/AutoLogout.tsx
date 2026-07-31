'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Minutos de inactividad antes de cerrar sesión automáticamente. */
const LIMITE_MS = 10 * 60 * 1000;

/**
 * Cierra la sesión automáticamente tras 10 min de inactividad, si el usuario
 * habilitó la opción en Ajustes. Se monta en los layouts de paciente y panel.
 */
export function AutoLogout({ habilitado }: { habilitado: boolean }) {
  const ultimaActividad = useRef(Date.now());

  useEffect(() => {
    if (!habilitado) return;

    const marcar = () => {
      ultimaActividad.current = Date.now();
    };
    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    const onVisibilidad = () => {
      if (document.visibilityState === 'visible') marcar();
    };
    document.addEventListener('visibilitychange', onVisibilidad);

    let cerrando = false;
    const intervalo = setInterval(async () => {
      if (cerrando) return;
      if (Date.now() - ultimaActividad.current >= LIMITE_MS) {
        cerrando = true;
        try {
          await createClient().auth.signOut();
        } finally {
          window.location.href = '/signin?motivo=inactividad';
        }
      }
    }, 15000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcar));
      document.removeEventListener('visibilitychange', onVisibilidad);
      clearInterval(intervalo);
    };
  }, [habilitado]);

  return null;
}
