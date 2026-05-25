/**
 * Tipos generados desde el schema de Supabase.
 *
 * Este archivo se REGENERA automáticamente con:
 *   pnpm --filter @noema/database gen-types
 *
 * No editar a mano. Por ahora es un stub mientras se construye el schema
 * en `supabase/migrations/`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Stub — se reemplaza al correr `gen-types` contra el schema real.
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
