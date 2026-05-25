'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: traducirError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/inicio');
}

export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nombre = String(formData.get('nombre') ?? '').trim();

  if (password.length < 8) {
    return { ok: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { rol: 'terapeuta', nombre },
      // En producción, esto debe ser tu dominio real
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/inicio`,
    },
  });

  if (error) {
    return { ok: false, error: traducirError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding/perfil');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/signin');
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('user already registered')) return 'Ya hay una cuenta con ese correo.';
  if (m.includes('email rate limit')) return 'Hemos enviado muchos correos a esta dirección. Inténtalo más tarde.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  return 'Algo no funcionó. Inténtalo en un momento.';
}
