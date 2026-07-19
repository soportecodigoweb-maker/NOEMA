import type { SupabaseClient } from '@supabase/supabase-js';

export interface PerfilBasico {
  id: string;
  nombre: string;
  avatar_url: string | null;
}

/**
 * El FK vinculaciones.paciente_id apunta a pacientes(profile_id), no a
 * profiles — así que el embed `profiles!vinculaciones_paciente_id_fkey` no
 * resuelve en PostgREST. Como paciente_id === profiles.id, resolvemos los
 * perfiles en una segunda consulta y los devolvemos como un mapa por id.
 */
export async function perfilesPorId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  ids: Array<string | null | undefined>,
): Promise<Map<string, PerfilBasico>> {
  const limpios = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  const mapa = new Map<string, PerfilBasico>();
  if (limpios.length === 0) return mapa;

  const { data } = await supabase
    .from('profiles')
    .select('id, nombre, avatar_url')
    .in('id', limpios);

  for (const p of data ?? []) mapa.set(p.id, p as PerfilBasico);
  return mapa;
}
