/**
 * Cliente Supabase para Client Components.
 * Usa cookies del navegador (manejadas por @supabase/ssr internamente).
 *
 * Modo demo: en las rutas /paciente se usa la sesión del paciente demo
 * (clave distinta), igual que en el servidor. El cambio de rol en el demo se
 * hace con una carga completa de página, así que la clave no cambia a mitad
 * de una misma pantalla.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@noema/database';
import {
  COOKIE_DEMO_UI,
  STORAGE_KEY_AUTH,
  STORAGE_KEY_DEMO_PACIENTE,
  esRutaPaciente,
} from '@/lib/demo/constantes';

function claveSesion(): string {
  if (typeof window === 'undefined') return STORAGE_KEY_AUTH;
  const hayDemo = document.cookie.split(';').some((c) => c.trim() === `${COOKIE_DEMO_UI}=1`);
  return hayDemo && esRutaPaciente(window.location.pathname) ? STORAGE_KEY_DEMO_PACIENTE : STORAGE_KEY_AUTH;
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Forzar path / para que las cookies sean accesibles en TODAS las rutas
        // (sin esto, con URL .../supabase, las cookies se setean en path /supabase
        // y no se mandan en requests a /inicio, /pacientes, etc).
        path: '/',
        sameSite: 'lax',
        secure: true,
      },
      // storageKey FIJO: el navegador usa la URL pública y el servidor la interna;
      // sin una clave fija, el nombre de la cookie (incl. el code_verifier de PKCE)
      // no coincidiría entre ambos y el login con Google fallaría al volver.
      auth: { storageKey: claveSesion(), flowType: 'pkce' },
    },
  );
}
