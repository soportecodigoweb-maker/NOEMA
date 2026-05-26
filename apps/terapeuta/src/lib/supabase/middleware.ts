/**
 * Helper para el middleware de Next.js — refresca sesiones de Supabase
 * y aplica el redirect según auth.
 *
 * Llamado desde middleware.ts en la raíz del app.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@noema/database';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Esto SIEMPRE debe ir aquí — refresca el token si está por expirar
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Rutas públicas (los grupos (auth), (onboarding), (panel) NO van en la URL)
  const isAuthPage = path === '/signin' || path === '/signup';
  const isLegalPage = path === '/terminos' || path === '/privacidad';
  const isPublic = isAuthPage || isLegalPage || path === '/' || path.startsWith('/_next');

  if (!user && !isPublic) {
    // Sin sesión y página privada → mandar a signin
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  if (user && (path === '/' || isAuthPage)) {
    // Con sesión y página de auth → mandar al panel
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    return NextResponse.redirect(url);
  }

  return response;
}
