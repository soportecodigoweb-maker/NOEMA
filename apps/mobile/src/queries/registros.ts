/**
 * Tipos y queries relacionados con registros emocionales.
 *
 * Idealmente se generan automáticamente desde `packages/database/src/types.ts`,
 * pero aquí re-exportamos los alias más útiles para la app paciente.
 */
import type { Database } from '@noema/database';

export type FamiliaEmocional = Database['public']['Enums']['familia_emocional'];
export type NivelPrivacidad = Database['public']['Enums']['nivel_privacidad'];

export type RegistroEmocional = Database['public']['Tables']['registros_emocionales']['Row'];
export type RegistroEmocionalInsert = Database['public']['Tables']['registros_emocionales']['Insert'];

export type EmocionCatalogo = Database['public']['Tables']['emociones_catalogo']['Row'];
