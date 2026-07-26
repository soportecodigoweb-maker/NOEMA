'use client';

/**
 * Callback de autenticación — versión CLIENTE.
 *
 * El intercambio del código por sesión se hace EN EL NAVEGADOR con el mismo
 * cliente que guardó el `code_verifier` de PKCE. Así se evita el error
 * `bad_code_verifier` que ocurría al canjear en el servidor (el verifier lo
 * escribe el navegador y lo leía el server con codificación distinta).
 *
 * Aterrizan aquí: inicio con Google/OAuth, confirmación de correo y recuperación
 * de contraseña. Tras canjear, hacemos navegación dura para que el SSR reciba
 * las cookies de sesión ya establecidas.
 */
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    const next = params.get('next') ?? '/inicio';
    const supabase = createClient();

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'email_change',
            token_hash: tokenHash,
          });
          if (error) throw error;
        } else {
          throw new Error('Sin código de autenticación');
        }
        // Navegación dura: el request a `next` ya lleva las cookies de sesión.
        window.location.href = next;
      } catch {
        window.location.href = '/signin?error=confirmacion';
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-sm text-foreground-muted">Completando tu inicio de sesión…</p>
    </div>
  );
}
