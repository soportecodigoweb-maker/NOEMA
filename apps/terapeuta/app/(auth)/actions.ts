'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { COOKIE_DEMO, COOKIE_DEMO_UI, STORAGE_KEY_DEMO_PACIENTE } from '@/lib/demo/constantes';

/**
 * Si la persona venía del demo público y ahora inicia sesión con su cuenta
 * real, se retira el demo (cookies y sesión del paciente demo) para que las
 * rutas /paciente no la manden al sandbox.
 */
async function salirDelDemo() {
  try {
    const jar = await cookies();
    if (!jar.get(COOKIE_DEMO)) return;
    jar.set(COOKIE_DEMO, '', { path: '/', maxAge: 0 });
    jar.set(COOKIE_DEMO_UI, '', { path: '/', maxAge: 0 });
    for (const c of jar.getAll()) {
      if (c.name.startsWith(STORAGE_KEY_DEMO_PACIENTE)) jar.set(c.name, '', { path: '/', maxAge: 0 });
    }
  } catch {
    /* fuera de una acción: nada que hacer */
  }
}

/** URL base real de esta petición (funciona en Vercel sin depender de env). */
async function origenActual(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3006';
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  await salirDelDemo();
  const supabase = await createClient({ storageKey: 'sb-noema-auth' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: traducirError(error.message) };
  }

  if (!data.user) {
    return { ok: false, error: 'No pudimos iniciar sesión.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, onboarding_completo')
    .eq('id', data.user.id)
    .single();

  revalidatePath('/', 'layout');

  if (!profile) {
    redirect('/perfil');
  }

  if (profile.rol === 'terapeuta' || profile.rol === 'admin') {
    redirect('/inicio');
  }

  if (profile.rol === 'sin_terapeuta') {
    redirect('/onboarding');
  }

  if (profile.rol === 'paciente') {
    redirect('/paciente');
  }

  redirect('/onboarding');
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nombre = String(formData.get('nombre') ?? '').trim();

  if (password.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const supabase = await createClient();
  const origin = await origenActual();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre },
      // El correo de confirmación aterriza en /auth/callback, que canjea el
      // código por sesión y luego lo manda al onboarding.
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { ok: false, error: traducirError(error.message) };
  }

  revalidatePath('/', 'layout');
  // Usuario nuevo → onboarding: elige si es terapeuta o paciente y completa datos.
  redirect('/onboarding');
}

/**
 * Inicia sesión / registro con Google (OAuth).
 *
 * Redirige a Google; al volver, /auth/callback canjea el código por sesión. Los
 * usuarios existentes entran con su rol; los nuevos quedan como paciente
 * (sin_terapeuta) y podrán completar sus datos después.
 *
 * Requiere configurar el proveedor Google en Supabase → Authentication →
 * Providers (Client ID y Secret). Sin eso, Supabase responde con error.
 */
export async function signInWithGoogleAction(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const origin = await origenActual();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/inicio`,
    },
  });

  if (error || !data?.url) {
    return { ok: false, error: 'No pudimos conectar con Google. Intenta con tu correo.' };
  }

  // `data.url` se genera con el host INTERNO (SUPABASE_INTERNAL_URL, p.ej.
  // http://supabase-kong:8000) que solo existe dentro de Docker. El navegador
  // debe ir a la URL pública, así que reescribimos el host antes de redirigir.
  const internal = process.env.SUPABASE_INTERNAL_URL;
  const publica = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const destino =
    internal && publica ? data.url.replace(internal, publica) : data.url;

  redirect(destino);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/signin');
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('user already registered')) return 'Ya hay una cuenta con ese correo.';
  if (m.includes('email rate limit')) return 'Hemos enviado muchos correos a esta dirección. Inténtalo más tarde.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  return 'Algo no funcionó. Inténtalo en un momento.';
}
