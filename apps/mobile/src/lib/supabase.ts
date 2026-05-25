/**
 * Cliente Supabase para la app paciente.
 *
 * - Sesión persistente en SecureStore (segura, cifrada en iOS Keychain / Android Keystore)
 * - URL polyfill para fetch en React Native
 * - Autorefresh de tokens
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNoemaClient } from '@noema/database';
import Constants from 'expo-constants';

// Las envs públicas se inyectan vía EXPO_PUBLIC_*
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[NOEMA] EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY no definidos. ' +
      'Copia .env.example a .env.local en apps/mobile/ y ejecuta `pnpm supabase:start`.',
  );
}

export const supabase = createNoemaClient({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  options: {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // mobile no usa URL detection
    },
    global: {
      headers: {
        'x-noema-app': 'mobile',
        'x-noema-version': Constants.expoConfig?.version ?? '0.0.0',
      },
    },
  },
});
