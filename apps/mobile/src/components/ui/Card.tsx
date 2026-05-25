import { View, type ViewProps, StyleSheet } from 'react-native';
import { colors, spacing, radii, shadows } from '@/lib/theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'flat' | 'inverse';
  padding?: keyof typeof spacing;
}

/**
 * Tarjeta NOEMA. Por defecto fondo bone con sombra apenas perceptible.
 *
 * - default: bone con sombra suave
 * - flat: sin sombra, solo borde sutil
 * - inverse: fondo sage, texto claro (uso restringido)
 */
export function Card({
  variant = 'default',
  padding = 4,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      {...props}
      style={[
        styles.base,
        variantStyles[variant],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.bone,
    shadowColor: colors.noemaDeep,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  flat: {
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.08)',
  },
  inverse: {
    backgroundColor: colors.noemaSage,
  },
});
