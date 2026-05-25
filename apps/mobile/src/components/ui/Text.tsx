import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { textVariants, type TextVariant } from '@/lib/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
}

/**
 * Componente Text NOEMA — siempre usa una variante tipográfica del sistema.
 *
 * @example
 *   <Text variant="h1">Hola, Andrea</Text>
 *   <Text variant="bodyL" color="#5C6B5A">Acompañada</Text>
 */
export function Text({
  variant = 'bodyM',
  color,
  align,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      {...props}
      style={[
        textVariants[variant],
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
