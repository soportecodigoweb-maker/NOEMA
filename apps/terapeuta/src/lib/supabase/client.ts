/**
 * Cliente Supabase para Client Components.
 * Usa cookies del navegador (manejadas por @supabase/ssr internamente).
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@noema/database';

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
    },
  );
}
