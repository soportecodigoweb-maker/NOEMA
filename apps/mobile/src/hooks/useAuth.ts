/**
 * Hook de autenticación para la app paciente.
 *
 * Expone:
 *   - session: la sesión actual de Supabase (null si no hay)
 *   - user: el usuario autenticado (null si no hay)
 *   - profile: el profile de NOEMA con rol y nombre (null si no hay)
 *   - loading: true mientras se hidrata la sesión inicial
 *   - signIn, signUp, signOut: helpers
 */
import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type RolUsuario = 'terapeuta' | 'paciente' | 'sin_terapeuta' | 'admin';

export interface NoemaProfile {
  id: string;
  email: string;
  rol: RolUsuario;
  nombre: string;
  avatar_url?: string | null;
  onboarding_completo: boolean;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: NoemaProfile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  // Cargar profile desde DB
  const loadProfile = useCallback(async (userId: string): Promise<NoemaProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, rol, nombre, avatar_url, onboarding_completo')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('[useAuth] no se pudo cargar profile:', error.message);
      return null;
    }
    return data as NoemaProfile;
  }, []);

  // Hidratar sesión inicial y suscribirse a cambios
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const profile = session ? await loadProfile(session.user.id) : null;
      if (!mounted) return;
      setState({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session ? await loadProfile(session.user.id) : null;
      if (!mounted) return;
      setState({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
      });
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, rol: RolUsuario, nombre: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { rol, nombre },
        },
      });
      if (error) throw error;
      return data;
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  // Forzar reload del profile (útil después de cambios como completar
  // onboarding, donde el AuthGate necesita ver el cambio inmediatamente).
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await loadProfile(state.user.id);
    setState((s) => ({ ...s, profile }));
  }, [state.user, loadProfile]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}
