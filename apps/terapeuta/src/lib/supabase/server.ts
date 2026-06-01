/**
 * Cliente Supabase para Server Components y Server Actions.
 * Lee/escribe cookies vía next/headers.
 *
 * IMPORTANTE: este cliente es por-request. NUNCA cachear la instancia
 * entre requests (compartiría sesiones de distintos usuarios).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@noema/database';

export async function createClient() {
  const cookieStore = await cookies();

  // En producción usamos URL interna (red Docker → kong:8000) para SSR.
  // Sin esto, el server llamaría a la URL pública (HTTPS), que requiere DNS+SSL ya configurados.
  // El client-side sigue usando NEXT_PUBLIC_SUPABASE_URL (el browser).
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return createServerClient<Database>(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Forzar path / para que las cookies se manden en TODAS las rutas
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, path: '/' }),
            );
          } catch {
            // setAll falla en Server Components (read-only). El middleware
            // refresca las cookies, así que esto es seguro de ignorar aquí.
          }
        },
      },
    },
  );
}
