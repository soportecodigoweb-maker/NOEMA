/**
 * Pantalla de bienvenida (splash interactivo).
 *
 * Diseño: fondo deep, vesica grande, wordmark + tagline + 2 botones.
 * La vesica respira suave (animación de opacidad, no rotación — la marca
 * no rota, BIBLIA §2).
 */
import { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { Vesica } from '@/components/ui/Vesica';
import { Button } from '@/components/ui/Button';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { esMX } from '@noema/i18n';

export default function WelcomeScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const vesicaAnim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Animated.View style={vesicaAnim}>
          <Vesica size={140} color={colors.bone} strokeWidth={1.5} />
        </Animated.View>
        <View style={styles.wordmarkBlock}>
          <Text style={styles.wordmark}>NOEMA</Text>
          <Text style={styles.tagline}>{esMX.common.tagline}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="inverse"
          fullWidth
          size="lg"
          onPress={() => router.push('/(auth)/signup')}
        >
          Crear cuenta
        </Button>
        <Pressable
          onPress={() => router.push('/(auth)/signin')}
          style={styles.signInRow}
        >
          <Text style={styles.signInText}>
            ¿Ya tienes cuenta?  <Text style={styles.signInLink}>Inicia sesión</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.noemaDeep,
    paddingHorizontal: spacing[6],
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  wordmarkBlock: {
    alignItems: 'center',
    gap: spacing[3],
  },
  wordmark: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 44,
    color: colors.bone,
    letterSpacing: 14, // ~0.34em según manual
  },
  tagline: {
    fontFamily: fontFamily.serifLightItalic,
    fontSize: 16,
    color: 'rgba(250, 247, 241, 0.7)',
    textAlign: 'center',
  },
  actions: {
    paddingBottom: spacing[6],
    gap: spacing[4],
  },
  signInRow: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  signInText: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 14,
    color: 'rgba(250, 247, 241, 0.75)',
  },
  signInLink: {
    fontFamily: fontFamily.sansMedium,
    color: colors.bone,
    textDecorationLine: 'underline',
  },
});
