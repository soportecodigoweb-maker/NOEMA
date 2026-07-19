/**
 * Root layout — la primera capa que monta Expo Router.
 *
 * Responsabilidades:
 *   1. Cargar las fuentes (Cormorant + DM Sans) antes de soltar el splash
 *   2. Configurar el SafeAreaProvider (necesario por SafeAreaView en pantallas)
 *   3. Decidir routing inicial según estado de auth:
 *        - sin sesión → (auth)
 *        - con sesión sin onboarding → (onboarding)
 *        - con sesión + onboarding → (paciente)
 *   4. Mantener el splash visible hasta que sepamos a dónde mandar al usuario
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_300Light_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { colors } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { useAvisoPrivacidad } from '@/hooks/useAvisoPrivacidad';

SystemUI.setBackgroundColorAsync(colors.paper).catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'CormorantGaramond-Light': CormorantGaramond_300Light,
    'CormorantGaramond-Regular': CormorantGaramond_400Regular,
    'CormorantGaramond-Medium': CormorantGaramond_500Medium,
    'CormorantGaramond-SemiBold': CormorantGaramond_600SemiBold,
    'CormorantGaramond-LightItalic': CormorantGaramond_300Light_Italic,
    'DMSans-Light': DMSans_400Regular,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-SemiBold': DMSans_500Medium,
    'DMSans-Bold': DMSans_700Bold,
  });

  const [fontsTimeout, setFontsTimeout] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => setFontsTimeout(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded && !fontError && !fontsTimeout) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AuthGate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Aviso de privacidad (#9): solo checamos para pacientes autenticados.
  const esPaciente = profile?.rol === 'paciente' || profile?.rol === 'sin_terapeuta';
  const avisoEstado = useAvisoPrivacidad(esPaciente ? profile?.id : null);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const onAviso = segments[0] === '(onboarding)' && segments[1] === 'aviso-privacidad';
    const onCrisis = segments[0] === 'crisis';

    if (onCrisis) return;

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (!profile) return;

    // Aviso de privacidad al primer uso — antes de cualquier otra cosa (#9).
    if (esPaciente) {
      if (avisoEstado === 'checking') return; // esperar el chequeo
      if (avisoEstado === 'pending') {
        if (!onAviso) {
          router.replace('/(onboarding)/aviso-privacidad');
        }
        return;
      }
    }

    if (!profile.onboarding_completo) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/codigo');
      }
      return;
    }

    // Routing por rol:
    //   - paciente (con terapeuta vinculado) → app completa de paciente
    //   - sin_terapeuta → modo educativo (catálogo de contenido)
    //   - terapeuta → mensaje "esta app es para pacientes"
    const inPacienteGroup = segments[0] === '(paciente)';
    const inSinTerapeutaGroup = segments[0] === '(sin-terapeuta)';

    if (profile.rol === 'sin_terapeuta') {
      if (!inSinTerapeutaGroup) {
        router.replace('/(sin-terapeuta)/inicio');
      }
      return;
    }

    if (profile.rol === 'paciente') {
      if (!inPacienteGroup) {
        router.replace('/(paciente)/inicio');
      }
      return;
    }

    // Cualquier otro rol (terapeuta, admin) — fallback a auth
    if (inAuthGroup || inOnboardingGroup) {
      router.replace('/(auth)/welcome');
    }
  }, [session, profile, loading, segments, router, esPaciente, avisoEstado]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(paciente)" />
      <Stack.Screen name="(sin-terapeuta)" />
      <Stack.Screen
        name="crisis"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
