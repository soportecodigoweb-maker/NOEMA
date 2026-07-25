import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback de autenticación.
 *
 * Aquí aterrizan los enlaces de:
 *  - confirmación de correo (registro),
 *  - inicio con Google / OAuth,
 *  - recuperación de contraseña.
 *
 * Antes NO existía esta ruta, así que el enlace del correo caía en /inicio con
 * un `code` que nadie canjeaba por sesión → el enlace "no funcionaba". Aquí
 * intercambiamos el código (o el token_hash) por una sesión y redirigimos.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/inicio';

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'recovery' | 'invite' | 'email_change',
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Algo falló (código vencido o ya usado): mandamos a iniciar sesión con aviso.
  return NextResponse.redirect(`${origin}/signin?error=confirmacion`);
}
