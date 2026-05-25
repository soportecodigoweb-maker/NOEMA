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

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
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
