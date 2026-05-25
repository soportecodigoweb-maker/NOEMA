import Svg, { Circle, type SvgProps } from 'react-native-svg';
import { colors } from '@/lib/theme';

export interface VesicaProps extends SvgProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * El símbolo NOEMA: dos círculos que se intersectan (vesica piscis).
 *
 * Construcción según manual de identidad:
 *   - Radio r
 *   - Distancia entre centros d = ⅔r
 *   - Trazo outline 2pt (proporcional al artboard de 120)
 *   - Sin relleno, sin sombras
 */
export function Vesica({
  size = 120,
  color = colors.noemaSage,
  strokeWidth = 2,
  ...props
}: VesicaProps) {
  // Geometría: artboard 120x120, círculos de radio 36, centros separados 24 (⅔r)
  const r = 36;
  const cx1 = 60 - 12; // 48
  const cx2 = 60 + 12; // 72
  const cy = 60;

  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
    >
      <Circle cx={cx1} cy={cy} r={r} stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={cx2} cy={cy} r={r} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
