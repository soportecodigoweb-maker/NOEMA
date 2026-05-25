/**
 * Cliente Supabase tipado.
 *
 * Cada app (mobile, terapeuta, web) crea su propia instancia con sus envs
 * llamando a `createNoemaClient`. Mantenemos la firma única para que las
 * queries de `@noema/database` funcionen igual en todos lados.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type NoemaClient = SupabaseClient<Database>;

export interface CreateClientOptions {
  /** URL de Supabase (público en frontend) */
  url: string;
  /** Anon key (público en frontend) */
  anonKey: string;
  /** Si es para Server Components, se puede pasar la service-role key (NUNCA al cliente) */
  serviceRoleKey?: string;
  /** Opciones extra del SDK */
  options?: Parameters<typeof createClient>[2];
}

export function createNoemaClient({
  url,
  anonKey,
  serviceRoleKey,
  options,
}: CreateClientOptions): NoemaClient {
  const key = serviceRoleKey ?? anonKey;
  return createClient<Database>(url, key, options);
}
