/**
 * Cliente Supabase con service_role — SOLO en el servidor (rutas /api, jobs).
 * Salta RLS: úsalo únicamente para operaciones del sistema, nunca para leer
 * datos "en nombre" del usuario. Mismo patrón que admin() en app/admin/data.ts.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@noema/database';

export function createServiceClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
