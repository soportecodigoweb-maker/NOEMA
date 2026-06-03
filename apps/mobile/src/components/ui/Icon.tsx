/**
 * Sistema de iconos NOEMA — SVG outline minimalistas 24x24.
 *
 * Estilo: stroke 1.5, line cap round, sin relleno. Coincide con el manual
 * de identidad ("Iconografía outline 24x24").
 */
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'pulse'
  | 'chart'
  | 'book'
  | 'user'
  | 'plus'
  | 'message'
  | 'calendar'
  | 'pen'
  | 'check-square'
  | 'heart'
  | 'shield'
  | 'phone';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.5,
}: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'home':
      return (
        <Svg {...common}>
          <Path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </Svg>
      );
    case 'pulse':
      return (
        <Svg {...common}>
          <Polyline points="3,12 7,12 10,5 14,19 17,12 21,12" />
        </Svg>
      );
    case 'chart':
      return (
        <Svg {...common}>
          <Line x1="4" y1="20" x2="4" y2="10" />
          <Line x1="10" y1="20" x2="10" y2="4" />
          <Line x1="16" y1="20" x2="16" y2="13" />
          <Line x1="2" y1="20" x2="22" y2="20" />
        </Svg>
      );
    case 'book':
      return (
        <Svg {...common}>
          <Path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" />
          <Path d="M4 17a3 3 0 0 1 3-3h12" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      );
    case 'message':
      return (
        <Svg {...common}>
          <Path d="M4 5h16v11H8l-4 4z" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...common}>
          <Path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <Line x1="4" y1="10" x2="20" y2="10" />
          <Line x1="9" y1="3" x2="9" y2="7" />
          <Line x1="15" y1="3" x2="15" y2="7" />
        </Svg>
      );
    case 'pen':
      return (
        <Svg {...common}>
          <Path d="M12 20h9" />
          <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
        </Svg>
      );
    case 'check-square':
      return (
        <Svg {...common}>
          <Polyline points="9,11 12,14 22,4" />
          <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...common}>
          <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...common}>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>
      );
    case 'phone':
      return (
        <Svg {...common}>
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </Svg>
      );
  }
}
