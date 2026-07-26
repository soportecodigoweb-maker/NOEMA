'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Completa el onboarding: el usuario elige si es TERAPEUTA o PACIENTE y llena
 * los datos que su cuenta (correo o Google) no aporta.
 *
 * El rol se asigna aquí (no en el registro) porque con Google/App Store el
 * usuario se auto-registra sin poder indicar su tipo. Usamos el cliente de
 * servicio para fijar el rol (el trigger deja a todos como 'sin_terapeuta' por
 * seguridad; aquí es un flujo controlado tras confirmar la sesión).
 */
function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface OnboardingResult {
  ok: boolean;
  error?: string;
}

export async function completarOnboardingAction(
  formData: FormData,
): Promise<OnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró. Inicia sesión de nuevo.' };

  const rol = String(formData.get('rol') ?? '');
  const nombre = String(formData.get('nombre') ?? '').trim();
  const apellidos = String(formData.get('apellidos') ?? '').trim();

  if (rol !== 'terapeuta' && rol !== 'paciente') {
    return { ok: false, error: 'Elige si eres terapeuta o paciente.' };
  }
  if (!nombre || !apellidos) {
    return { ok: false, error: 'Ingresa tu nombre y apellidos.' };
  }

  const db = admin();

  // --- Paciente: datos mínimos ---
  if (rol === 'paciente') {
    const { error } = await db
      .from('profiles')
      .update({ rol: 'paciente', nombre, apellidos, onboarding_completo: true })
      .eq('id', user.id);
    if (error) return { ok: false, error: 'No pudimos guardar tus datos. Intenta de nuevo.' };
    revalidatePath('/', 'layout');
    redirect('/paciente');
  }

  // --- Terapeuta: datos profesionales obligatorios ---
  const cedula = String(formData.get('cedula_profesional') ?? '').trim();
  const titulo = String(formData.get('titulo') ?? '').trim();
  const especialidad = String(formData.get('especialidad') ?? '').trim();
  const modalidades = formData.getAll('modalidades').map(String).filter(Boolean);

  if (!cedula || !titulo || !especialidad) {
    return { ok: false, error: 'Completa cédula profesional, título y especialidad.' };
  }
  if (modalidades.length === 0) {
    return { ok: false, error: 'Elige al menos una modalidad (en línea o presencial).' };
  }

  const { error: eProfile } = await db
    .from('profiles')
    .update({ rol: 'terapeuta', nombre, apellidos, onboarding_completo: true })
    .eq('id', user.id);
  if (eProfile) return { ok: false, error: 'No pudimos guardar tus datos. Intenta de nuevo.' };

  const { error: eTera } = await db.from('terapeutas').upsert(
    {
      profile_id: user.id,
      cedula_profesional: cedula,
      titulo,
      especialidades: [especialidad],
      modalidades,
    },
    { onConflict: 'profile_id' },
  );
  if (eTera) return { ok: false, error: 'No pudimos guardar tu ficha profesional. Intenta de nuevo.' };

  revalidatePath('/', 'layout');
  redirect('/inicio');
}
