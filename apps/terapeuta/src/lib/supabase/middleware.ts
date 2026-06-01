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

  // Middleware corre server-side: usar URL interna en prod (red Docker).
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabase = createServerClient<Database>(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
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
            response.cookies.set(name, value, { ...options, path: '/' }),
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

  // Rutas públicas (los grupos (auth), (onboarding), (panel), (public) NO van en la URL)
  const isAuthPage = path === '/signin' || path === '/signup';
  const isLegalPage = path === '/terminos' || path === '/privacidad';
  const isDirectorio = path === '/terapeutas' || path.startsWith('/terapeutas/');
  const isLanding = path === '/';
  const isPublic =
    isAuthPage ||
    isLegalPage ||
    isLanding ||
    isDirectorio ||
    path.startsWith('/_next');

  if (!user && !isPublic) {
    // Sin sesión y página privada → mandar a signin
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    // Con sesión y página de auth → mandar al panel
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    return NextResponse.redirect(url);
  }

  // Con sesión y en / o /terapeutas, dejamos pasar: la landing muestra
  // "Mi panel" en vez de "Iniciar sesión".

  return response;
}
