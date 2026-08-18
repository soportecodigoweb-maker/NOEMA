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

/** El terapeuta se vincula a un centro con el código del centro. */
export async function vincularseCentroAction(
  codigo: string,
): Promise<{ ok: boolean; error?: string; centro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró.' };

  const code = codigo.trim().toUpperCase();
  if (!code) return { ok: false, error: 'Escribe el código del centro.' };

  const { data: centro } = await supabase
    .from('centros')
    .select('profile_id, nombre_centro')
    .eq('codigo_centro', code)
    .maybeSingle();
  if (!centro) return { ok: false, error: 'No encontramos un centro con ese código.' };

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre, apellidos')
    .eq('id', user.id)
    .maybeSingle();
  const nombre = [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ') || 'Terapeuta';

  // Un terapeuta pertenece a un solo centro: reemplazamos su membresía previa.
  const db = admin();
  await db.from('centro_terapeutas').delete().eq('terapeuta_id', user.id);
  const { error } = await db.from('centro_terapeutas').insert({
    centro_id: centro.profile_id,
    terapeuta_id: user.id,
    terapeuta_nombre: nombre,
    estado: 'activa',
  });
  if (error) return { ok: false, error: 'No se pudo vincular al centro. Intenta de nuevo.' };

  // Avisar al centro.
  await db.from('notificaciones').insert({
    destinatario_id: centro.profile_id,
    tipo: 'centro',
    titulo: 'Un terapeuta se vinculó a tu centro',
    cuerpo: `${nombre} ahora forma parte de tu centro.`,
    url: '/centro',
  });

  revalidatePath('/ajustes');
  return { ok: true, centro: centro.nombre_centro };
}

/** El terapeuta responde a la invitación que le envió un centro. */
export async function responderInvitacionCentroAction(
  centroId: string,
  acepta: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const db = admin();
  const { data: ct } = await db
    .from('centro_terapeutas')
    .select('id, estado')
    .eq('centro_id', centroId)
    .eq('terapeuta_id', user.id)
    .maybeSingle();
  if (!ct || ct.estado !== 'pendiente') return { ok: false };

  if (acepta) {
    // El terapeuta aceptó el acuerdo; ahora el centro debe confirmar (doble aceptación).
    await db
      .from('centro_terapeutas')
      .update({ estado: 'por_confirmar', acuerdo_aceptado_at: new Date().toISOString() })
      .eq('id', ct.id);
  } else {
    await db.from('centro_terapeutas').delete().eq('id', ct.id);
  }

  const { data: perfil } = await db
    .from('profiles')
    .select('nombre, apellidos')
    .eq('id', user.id)
    .maybeSingle();
  const nombre = [perfil?.nombre, perfil?.apellidos].filter(Boolean).join(' ') || 'Un terapeuta';
  await db.from('notificaciones').insert({
    destinatario_id: centroId,
    tipo: 'centro',
    titulo: acepta ? 'Un terapeuta aceptó el acuerdo' : 'Invitación rechazada',
    cuerpo: acepta
      ? `${nombre} aceptó el acuerdo de colaboración. Confirma su incorporación para que forme parte del equipo.`
      : `${nombre} no aceptó la invitación a tu centro.`,
    url: '/centro/terapeutas',
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}

/** El terapeuta sale del centro al que pertenece. */
export async function salirCentroAction(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.from('centro_terapeutas').delete().eq('terapeuta_id', user.id);
  if (error) return { ok: false };
  revalidatePath('/ajustes');
  return { ok: true };
}
