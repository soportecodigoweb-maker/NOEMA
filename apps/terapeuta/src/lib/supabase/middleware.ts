/**
 * Helper para el middleware de Next.js — refresca sesiones de Supabase
 * y aplica el redirect según auth.
 *
 * Llamado desde middleware.ts en la raíz del app.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@noema/database';

/** Ruta de inicio según el rol del usuario. */
function panelDe(rol: string | null): string {
  if (rol === 'admin') return '/admin';
  if (rol === 'terapeuta') return '/inicio';
  if (rol === 'centro') return '/centro';
  return '/paciente';
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Middleware corre server-side: usar URL interna en prod (red Docker).
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabase = createServerClient<Database>(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { storageKey: 'sb-noema-auth', flowType: 'pkce' },
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

  // Rol del usuario (para el gate de onboarding). Solo si hay sesión.
  let rol: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();
    rol = perfil?.rol ?? null;
  }

  const path = request.nextUrl.pathname;

  // Rutas públicas (los grupos (auth), (onboarding), (panel), (public) NO van en la URL)
  const isAuthPage = path === '/signin' || path === '/signup';
  const isLegalPage = path === '/terminos' || path === '/privacidad';
  const isDirectorio = path === '/terapeutas' || path.startsWith('/terapeutas/');
  const isLanding = path === '/';
  // El callback de auth debe cargar SIN sesión (ahí es donde se establece).
  const isCallback = path === '/auth/callback';
  const isPublic =
    isAuthPage ||
    isLegalPage ||
    isLanding ||
    isDirectorio ||
    isCallback ||
    path.startsWith('/_next');

  if (!user && !isPublic) {
    // Sin sesión y página privada → mandar a signin
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // Usuario nuevo sin rol definido → forzar onboarding (elige rol + datos).
  if (user && rol === 'sin_terapeuta' && path !== '/onboarding' && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  // Ya tiene rol pero entra al onboarding → mandarlo a su panel.
  if (user && rol && rol !== 'sin_terapeuta' && path === '/onboarding') {
    const url = request.nextUrl.clone();
    url.pathname = panelDe(rol);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    // Con sesión y página de auth → al onboarding si es nuevo, si no al panel.
    const url = request.nextUrl.clone();
    url.pathname = rol === 'sin_terapeuta' ? '/onboarding' : panelDe(rol);
    return NextResponse.redirect(url);
  }

  // Con sesión y en / o /terapeutas, dejamos pasar: la landing muestra
  // "Mi panel" en vez de "Iniciar sesión".

  return response;
}
