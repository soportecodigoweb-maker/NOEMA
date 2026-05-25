'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface CrearVinculacionResult {
  ok: boolean;
  codigo?: string;
  error?: string;
}

export async function crearVinculacionAction(formData: FormData): Promise<CrearVinculacionResult> {
  const nombre = String(formData.get('nombre') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();

  if (!nombre) {
    return { ok: false, error: 'Ingresa al menos el nombre del paciente.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'No hay sesión activa.' };
  }

  // Insert — el código se autogenera por trigger en DB (NOEMA-XXXX).
  // Pasamos string vacío para satisfacer TS; el trigger BEFORE INSERT lo
  // sobrescribe con un código único tipo "NOEMA-A3F9".
  const { data, error } = await supabase
    .from('vinculaciones')
    .insert({
      terapeuta_id: user.id,
      nombre_invitado: nombre,
      email_invitado: email || null,
      estado: 'pendiente',
      codigo_invitacion: '',
    })
    .select('codigo_invitacion')
    .single();

  if (error) {
    return { ok: false, error: traducirError(error.message) };
  }

  revalidatePath('/pacientes');
  revalidatePath('/inicio');

  return { ok: true, codigo: data.codigo_invitacion };
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('violates') && m.includes('unique')) {
    return 'Esta vinculación ya existe. Inténtalo de nuevo.';
  }
  return 'No pudimos generar la vinculación. Inténtalo en un momento.';
}
