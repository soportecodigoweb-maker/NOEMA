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
import { useEffect } from 'react';
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

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(colors.paper).catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Mapeamos a los nombres que usa `theme.ts` (fontFamily)
    'CormorantGaramond-Light': CormorantGaramond_300Light,
    'CormorantGaramond-Regular': CormorantGaramond_400Regular,
    'CormorantGaramond-Medium': CormorantGaramond_500Medium,
    'CormorantGaramond-SemiBold': CormorantGaramond_600SemiBold,
    'CormorantGaramond-LightItalic': CormorantGaramond_300Light_Italic,
    // DM Sans del paquete oficial solo trae 400/500/700.
    // Mapeamos Light→Regular y SemiBold→Medium para mantener los nombres
    // del sistema de diseño consistentes (theme.ts no cambia).
    'DMSans-Light': DMSans_400Regular,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-SemiBold': DMSans_500Medium,
    'DMSans-Bold': DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
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

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const onCrisis = segments[0] === 'crisis';

    if (onCrisis) return;

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (!profile) return;

    if (!profile.onboarding_completo) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/codigo');
      }
      return;
    }

    if (inAuthGroup || inOnboardingGroup) {
      router.replace('/(paciente)/inicio');
    }
  }, [session, profile, loading, segments, router]);

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
