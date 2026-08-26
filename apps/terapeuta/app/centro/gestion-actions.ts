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

async function centroActual(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await admin().from('profiles').select('rol').eq('id', user.id).maybeSingle();
  return data?.rol === 'centro' ? user.id : null;
}

// ── Recursos para terapeutas ────────────────────────────────────────────────

export async function agregarRecursoCentroAction(
  titulo: string,
  tipo: string,
  url: string,
  nota: string,
  archivo?: { ruta: string; tipoMime: string; tamano: number } | null,
): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId || !titulo.trim()) return { ok: false };
  const { error } = await admin().from('centro_recursos').insert({
    centro_id: centroId,
    titulo: titulo.trim(),
    tipo: tipo || 'documento',
    url: url.trim() || null,
    nota: nota.trim() || null,
    ruta: archivo?.ruta ?? null,
    tipo_mime: archivo?.tipoMime ?? null,
    tamano_bytes: archivo?.tamano ?? null,
  });
  if (error) return { ok: false };
  revalidatePath('/centro/recursos');
  return { ok: true };
}

export async function eliminarRecursoCentroAction(id: string): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId) return { ok: false };
  const { error } = await admin().from('centro_recursos').delete().eq('id', id).eq('centro_id', centroId);
  if (error) return { ok: false };
  revalidatePath('/centro/recursos');
  return { ok: true };
}

// ── Anuncios ────────────────────────────────────────────────────────────────

export async function publicarAnuncioAction(titulo: string, cuerpo: string): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId || !titulo.trim() || !cuerpo.trim()) return { ok: false };
  const db = admin();
  const { error } = await db.from('centro_anuncios').insert({
    centro_id: centroId,
    titulo: titulo.trim(),
    cuerpo: cuerpo.trim(),
  });
  if (error) return { ok: false };

  const { data: miembros } = await db
    .from('centro_terapeutas')
    .select('terapeuta_id')
    .eq('centro_id', centroId)
    .eq('estado', 'activa');
  const notifs = (miembros ?? []).map((m) => ({
    destinatario_id: m.terapeuta_id,
    tipo: 'centro',
    titulo: `Anuncio del centro: ${titulo.trim()}`,
    cuerpo: cuerpo.trim().slice(0, 160),
    url: '/mi-centro',
  }));
  if (notifs.length) await db.from('notificaciones').insert(notifs);

  revalidatePath('/centro/comunicacion');
  return { ok: true };
}

export async function eliminarAnuncioAction(id: string): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId) return { ok: false };
  const { error } = await admin().from('centro_anuncios').delete().eq('id', id).eq('centro_id', centroId);
  if (error) return { ok: false };
  revalidatePath('/centro/comunicacion');
  return { ok: true };
}

// ── Mensajes 1 a 1 con un terapeuta ─────────────────────────────────────────

export async function enviarMensajeCentroAction(
  terapeutaId: string,
  cuerpo: string,
): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId || !cuerpo.trim()) return { ok: false };
  const db = admin();
  const { error } = await db.from('centro_mensajes').insert({
    centro_id: centroId,
    terapeuta_id: terapeutaId,
    autor_id: centroId,
    de_centro: true,
    cuerpo: cuerpo.trim(),
  });
  if (error) return { ok: false };

  const { data: c } = await db.from('centros').select('nombre_centro').eq('profile_id', centroId).maybeSingle();
  await db.from('notificaciones').insert({
    destinatario_id: terapeutaId,
    tipo: 'centro',
    titulo: `Mensaje de ${c?.nombre_centro ?? 'tu centro'}`,
    cuerpo: cuerpo.trim().slice(0, 160),
    url: '/mensajes/centro',
  });

  revalidatePath('/centro/comunicacion');
  return { ok: true };
}

// ── Acuerdos legales personalizados ─────────────────────────────────────────

export async function enviarAcuerdoAction(
  terapeutaId: string,
  titulo: string,
  contenido: string,
): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId || !titulo.trim() || !contenido.trim()) return { ok: false };
  const db = admin();
  const { error } = await db.from('centro_acuerdos').insert({
    centro_id: centroId,
    terapeuta_id: terapeutaId,
    titulo: titulo.trim(),
    contenido: contenido.trim(),
  });
  if (error) return { ok: false };

  await db.from('notificaciones').insert({
    destinatario_id: terapeutaId,
    tipo: 'centro',
    titulo: 'Tu centro te envió un acuerdo',
    cuerpo: `Tienes un documento para revisar y firmar: ${titulo.trim()}.`,
    url: '/mi-centro',
  });

  revalidatePath(`/centro/terapeutas/${terapeutaId}`);
  return { ok: true };
}

export async function eliminarAcuerdoAction(id: string, terapeutaId: string): Promise<{ ok: boolean }> {
  const centroId = await centroActual();
  if (!centroId) return { ok: false };
  const { error } = await admin().from('centro_acuerdos').delete().eq('id', id).eq('centro_id', centroId);
  if (error) return { ok: false };
  revalidatePath(`/centro/terapeutas/${terapeutaId}`);
  return { ok: true };
}
