import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radii, fontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { esMX } from '@noema/i18n';

/**
 * Botón omnipresente que abre la pantalla de crisis.
 *
 * Diseño: discreto pero accesible — no rojo estridente. Usa el ámbar suave
 * del acento "ansioso" como borde, para distinguirlo sin asustar.
 *
 * Posicionamiento: lo monta cada layout (no es global automático) para que
 * cada pantalla decida si va flotante, en el header o en la parte inferior.
 */
export interface CrisisButtonProps {
  variant?: 'floating' | 'inline';
}

export function CrisisButton({ variant = 'inline' }: CrisisButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push('/crisis');
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={esMX.crisis.triggerButton}
      style={({ pressed }) => [
        styles.base,
        variant === 'floating' ? styles.floating : styles.inline,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={styles.label}>{esMX.crisis.triggerButton}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: '#F0C9AE', // acento ansioso — distintivo sin agresivo
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    alignSelf: 'center',
  },
  floating: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[4],
    shadowColor: colors.noemaDeep,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: 0.2,
  },
});
