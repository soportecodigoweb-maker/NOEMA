'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
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
    redirect(profile.onboarding_completo ? '/inicio' : '/perfil');
  }

  if (profile.rol === 'paciente' || profile.rol === 'sin_terapeuta') {
    redirect('/paciente');
  }

  redirect('/perfil');
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
      data: { rol: 'terapeuta', nombre },
      // El correo de confirmación aterriza en /auth/callback, que canjea el
      // código por sesión y luego manda a /inicio. Usamos el origin real de la
      // petición para que el enlace no apunte a localhost en producción.
      emailRedirectTo: `${origin}/auth/callback?next=/inicio`,
    },
  });

  if (error) {
    return { ok: false, error: traducirError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/perfil');
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

  redirect(data.url);
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
