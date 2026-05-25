/**
 * Cliente Supabase para Client Components.
 * Usa cookies del navegador (manejadas por @supabase/ssr internamente).
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@noema/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
