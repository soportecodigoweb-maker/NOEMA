import {
  Pressable,
  type PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radii, fontFamily } from '@/lib/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/**
 * Botón con la voz NOEMA — calmado, sin emojis, con haptic suave al presionar.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  disabled,
  onPress,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (variant === 'danger') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant].container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? null : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {iconLeft}
          <Text
            color={variantStyles[variant].textColor}
            style={[
              labelStyles[size],
              { fontFamily: fontFamily.sansMedium },
            ]}
          >
            {children}
          </Text>
          {iconRight}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
  fullWidth: {
    width: '100%',
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    minHeight: 56,
  },
});

const labelStyles = StyleSheet.create({
  sm: { fontSize: 14, lineHeight: 18 },
  md: { fontSize: 16, lineHeight: 20 },
  lg: { fontSize: 17, lineHeight: 22 },
});

const variantStyles: Record<
  ButtonVariant,
  { container: object; textColor: string }
> = {
  primary: {
    container: { backgroundColor: colors.noemaSage },
    textColor: colors.bone,
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.noemaSage,
    },
    textColor: colors.noemaSage,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    textColor: colors.noemaSage,
  },
  danger: {
    container: { backgroundColor: '#B85450' },
    textColor: '#FFF',
  },
  // Para fondos oscuros (welcome screen) — fondo claro, texto oscuro
  inverse: {
    container: { backgroundColor: colors.bone },
    textColor: colors.noemaDeep,
  },
};
