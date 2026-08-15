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

/** El centro activa/desactiva la supervisión clínica. Al activar, pide a sus
 *  terapeutas que autoricen el acceso a la información de sus pacientes. */
export async function activarSupervisionAction(activo: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: perfil } = await db.from('profiles').select('rol').eq('id', user.id).maybeSingle();
  if (perfil?.rol !== 'centro') return { ok: false };

  const { error } = await db
    .from('centros')
    .update({ supervision_clinica: activo })
    .eq('profile_id', user.id);
  if (error) return { ok: false };

  if (activo) {
    const { data: nombreCentro } = await db
      .from('centros')
      .select('nombre_centro')
      .eq('profile_id', user.id)
      .maybeSingle();
    const { data: miembros } = await db
      .from('centro_terapeutas')
      .select('terapeuta_id')
      .eq('centro_id', user.id)
      .eq('estado', 'activa')
      .eq('supervision_autorizada', false);
    const notifs = (miembros ?? []).map((m) => ({
      destinatario_id: m.terapeuta_id,
      tipo: 'supervision',
      titulo: 'Tu centro solicita autorización de supervisión',
      cuerpo: `${nombreCentro?.nombre_centro ?? 'Tu centro'} activó supervisión clínica y pide tu autorización para acceder a la información de tus pacientes.`,
      url: '/inicio',
    }));
    if (notifs.length) await db.from('notificaciones').insert(notifs);
  }

  revalidatePath('/centro');
  return { ok: true };
}
