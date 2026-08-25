// Observaciones de supervisión que el centro dejó al terapeuta (solo server).
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { ObservacionSupervision } from '@/components/ajustes/ObservacionesSupervision';

function admin() {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function observacionesDelCentro(terapeutaId: string): Promise<ObservacionSupervision[]> {
  const db = admin();
  const { data } = await db
    .from('supervision_comentarios')
    .select('id, texto, contexto, creado_at, centro_id, visto_at')
    .eq('terapeuta_id', terapeutaId)
    .order('creado_at', { ascending: false })
    .limit(30);
  const items = data ?? [];
  if (items.length === 0) return [];

  const centroIds = [...new Set(items.map((x) => x.centro_id))];
  const nombres = new Map<string, string>();
  const { data: centros } = await db
    .from('centros')
    .select('profile_id, nombre_centro')
    .in('profile_id', centroIds);
  for (const c of centros ?? []) nombres.set(c.profile_id, c.nombre_centro);

  return items.map((x) => ({
    id: x.id,
    visto: !!x.visto_at,
    texto: x.texto,
    contexto: x.contexto ?? null,
    centro: nombres.get(x.centro_id) ?? 'Tu centro',
    fecha: new Date(x.creado_at).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City',
    }),
  }));
}
