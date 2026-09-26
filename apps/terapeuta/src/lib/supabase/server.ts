/**
 * Cliente Supabase para Server Components y Server Actions.
 * Lee/escribe cookies vía next/headers.
 *
 * IMPORTANTE: este cliente es por-request. NUNCA cachear la instancia
 * entre requests (compartiría sesiones de distintos usuarios).
 *
 * Modo demo: el middleware manda la ruta en `x-noema-ruta` y `x-noema-demo`
 * cuando hay visitante demo; con eso elegimos la sesión del paciente demo en
 * /paciente y la de la psicóloga demo en el resto (ver lib/demo/constantes).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import type { Database } from '@noema/database';
import { STORAGE_KEY_AUTH, STORAGE_KEY_DEMO_PACIENTE, esRutaPaciente } from '@/lib/demo/constantes';

/** Clave de sesión que toca según la petición actual. */
async function claveSesionActual(): Promise<string> {
  try {
    const h = await headers();
    if (h.get('x-noema-demo') === '1' && esRutaPaciente(h.get('x-noema-ruta') ?? '')) {
      return STORAGE_KEY_DEMO_PACIENTE;
    }
  } catch {
    /* fuera de una petición (build, jobs): sesión normal */
  }
  return STORAGE_KEY_AUTH;
}

export async function createClient(opts?: { storageKey?: string }) {
  const cookieStore = await cookies();
  const storageKey = opts?.storageKey ?? (await claveSesionActual());

  // En producción usamos URL interna (red Docker → kong:8000) para SSR.
  // Sin esto, el server llamaría a la URL pública (HTTPS), que requiere DNS+SSL ya configurados.
  // El client-side sigue usando NEXT_PUBLIC_SUPABASE_URL (el browser).
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return createServerClient<Database>(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // storageKey FIJO (igual en cliente/servidor/middleware) para que el
      // code_verifier de PKCE y las cookies de sesión tengan el mismo nombre
      // aunque el navegador use la URL pública y el server la interna.
      auth: { storageKey, flowType: 'pkce' },
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
