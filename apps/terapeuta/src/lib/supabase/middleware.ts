/**
 * Helper para el middleware de Next.js — refresca sesiones de Supabase
 * y aplica el redirect según auth.
 *
 * Llamado desde middleware.ts en la raíz del app.
 *
 * Modo demo: un visitante del demo tiene DOS sesiones a la vez (psicóloga demo
 * y paciente demo) guardadas bajo claves distintas. En las rutas /paciente se
 * usa la sesión del paciente; en el resto, la de la psicóloga. Así el panel y
 * la app del paciente pueden verse al mismo tiempo (ventana de teléfono,
 * video con laptop y teléfono) sin pisarse.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@noema/database';
import {
  COOKIE_DEMO,
  STORAGE_KEY_AUTH,
  STORAGE_KEY_DEMO_PACIENTE,
  esRutaPaciente,
} from '@/lib/demo/constantes';

/** Ruta de inicio según el rol del usuario. */
function panelDe(rol: string | null): string {
  if (rol === 'admin') return '/admin';
  if (rol === 'terapeuta') return '/inicio';
  if (rol === 'centro') return '/centro';
  return '/paciente';
}

/** Clave de la sesión que corresponde a una ruta (solo cambia en modo demo). */
export function claveSesionParaRuta(pathname: string, hayDemo: boolean): string {
  return hayDemo && esRutaPaciente(pathname) ? STORAGE_KEY_DEMO_PACIENTE : STORAGE_KEY_AUTH;
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hayDemo = request.cookies.has(COOKIE_DEMO);
  const storageKey = claveSesionParaRuta(path, hayDemo);

  // Los Server Components no conocen la ruta: se la pasamos en cabeceras para
  // que el cliente de servidor elija la misma sesión que aquí.
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set('x-noema-ruta', path);
  if (hayDemo) reqHeaders.set('x-noema-demo', '1');
  const siguiente = () => NextResponse.next({ request: { headers: reqHeaders } });

  let response = siguiente();

  // Middleware corre server-side: usar URL interna en prod (red Docker).
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabase = createServerClient<Database>(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { storageKey, flowType: 'pkce' },
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
          response = siguiente();
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

  // Rutas públicas (los grupos (auth), (onboarding), (panel), (public) NO van en la URL)
  const isAuthPage = path === '/signin' || path === '/signup';
  const isLegalPage = path === '/terminos' || path === '/privacidad';
  const isDirectorio = path === '/terapeutas' || path.startsWith('/terapeutas/');
  const isLanding = path === '/';
  // El callback de auth debe cargar SIN sesión (ahí es donde se establece).
  const isCallback = path === '/auth/callback';
  // /api/push/* se protege solo con CRON_SECRET (despachar) o con la sesión
  // que lee la propia ruta (prueba); sin esto el middleware lo manda a /signin.
  const isPushApi = path.startsWith('/api/push/');
  // Demo público (video demo, entrada al sandbox) y página web: sin sesión.
  const isDemo = path === '/demo' || path.startsWith('/demo/') || path === '/web';
  const isPublic =
    isAuthPage ||
    isLegalPage ||
    isLanding ||
    isDirectorio ||
    isCallback ||
    isPushApi ||
    isDemo ||
    path.startsWith('/_next');

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    if (hayDemo) {
      // El visitante del demo perdió su sesión (p. ej. el reinicio nocturno
      // borró sus cuentas): se le crea otra en silencio y vuelve a donde iba.
      url.pathname = '/demo/entrar';
      url.search = `?rol=${esRutaPaciente(path) ? 'paciente' : 'psicologo'}&a=${encodeURIComponent(path)}`;
      return NextResponse.redirect(url);
    }
    // Sin sesión y página privada → mandar a signin
    url.pathname = '/signin';
    url.search = '';
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
