'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function esDueno(userId: string): Promise<boolean> {
  const { data } = await admin().from('profiles').select('rol').eq('id', userId).maybeSingle();
  return data?.rol === 'admin';
}

/** El dueño vincula manualmente a un paciente con un terapeuta (por correo). */
export async function crearVinculacionManualAction(
  terapeutaEmail: string,
  pacienteEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await esDueno(user.id))) return { ok: false, error: 'Sin permiso.' };

  const db = admin();
  const te = terapeutaEmail.trim().toLowerCase();
  const pe = pacienteEmail.trim().toLowerCase();
  if (!te || !pe) return { ok: false, error: 'Escribe ambos correos.' };

  const { data: tera } = await db.from('profiles').select('id, rol').eq('email', te).maybeSingle();
  if (!tera || tera.rol !== 'terapeuta') {
    return { ok: false, error: 'No hay un terapeuta con ese correo.' };
  }
  const { data: pac } = await db.from('profiles').select('id, rol').eq('email', pe).maybeSingle();
  if (!pac || (pac.rol !== 'paciente' && pac.rol !== 'sin_terapeuta')) {
    return { ok: false, error: 'No hay un paciente con ese correo.' };
  }

  // El paciente no debe tener ya una vinculación activa o pausada.
  const { data: existente } = await db
    .from('vinculaciones')
    .select('id')
    .eq('paciente_id', pac.id)
    .in('estado', ['activa', 'pausada'])
    .maybeSingle();
  if (existente) return { ok: false, error: 'Ese paciente ya tiene una vinculación activa.' };

  const codigo = `NOEMA-${crypto.randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase()}`;
  const { error } = await db.from('vinculaciones').insert({
    terapeuta_id: tera.id,
    paciente_id: pac.id,
    codigo_invitacion: codigo,
    estado: 'activa',
    fecha_inicio: new Date().toISOString(),
  });
  if (error) return { ok: false, error: 'No se pudo crear la vinculación.' };

  // Asegurar que el paciente tenga rol 'paciente'.
  if (pac.rol === 'sin_terapeuta') {
    await db.from('profiles').update({ rol: 'paciente' }).eq('id', pac.id);
  }

  await db.from('notificaciones').insert([
    {
      destinatario_id: tera.id,
      tipo: 'vinculacion',
      titulo: 'Nuevo paciente vinculado',
      cuerpo: 'Se te vinculó un paciente desde la administración de NOEMA.',
      url: '/pacientes',
    },
    {
      destinatario_id: pac.id,
      tipo: 'vinculacion',
      titulo: 'Fuiste vinculado con un terapeuta',
      cuerpo: 'Ya puedes comenzar tu proceso en NOEMA.',
      url: '/paciente',
    },
  ]);

  revalidatePath('/admin/vincular');
  return { ok: true };
}

/** El dueño desvincula manualmente a un paciente de su terapeuta. Cierra la
 *  vinculación (estado 'finalizada') y avisa a ambas partes. */
export async function desvincularPacienteAdminAction(
  vinculacionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };
  if (!(await esDueno(user.id))) return { ok: false, error: 'Sin permiso.' };

  const db = admin();
  const { data: vinc } = await db
    .from('vinculaciones')
    .select('id, paciente_id, terapeuta_id, estado')
    .eq('id', vinculacionId)
    .maybeSingle();
  if (!vinc) return { ok: false, error: 'Vinculación no encontrada.' };

  const { error } = await db
    .from('vinculaciones')
    .update({ estado: 'finalizada', fecha_fin: new Date().toISOString() })
    .eq('id', vinculacionId);
  if (error) return { ok: false, error: 'No se pudo desvincular.' };

  // El paciente vuelve a estado sin_terapeuta.
  if (vinc.paciente_id) {
    await db.from('profiles').update({ rol: 'sin_terapeuta' }).eq('id', vinc.paciente_id);
  }

  const avisos = [];
  if (vinc.paciente_id)
    avisos.push({
      destinatario_id: vinc.paciente_id,
      tipo: 'vinculacion',
      titulo: 'Se cerró tu vínculo con tu terapeuta',
      cuerpo: 'La administración de NOEMA cerró tu vínculo. Puedes vincularte con un nuevo terapeuta cuando quieras.',
      url: '/paciente',
    });
  if (vinc.terapeuta_id)
    avisos.push({
      destinatario_id: vinc.terapeuta_id,
      tipo: 'vinculacion',
      titulo: 'Se cerró un vínculo con un paciente',
      cuerpo: 'La administración de NOEMA cerró el vínculo con uno de tus pacientes.',
      url: '/pacientes',
    });
  if (avisos.length) await db.from('notificaciones').insert(avisos);

  revalidatePath('/admin/usuarios');
  return { ok: true };
}
