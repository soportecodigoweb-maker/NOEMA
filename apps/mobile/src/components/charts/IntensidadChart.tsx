/**
 * Gráfica de área NOEMA — minimalista, color sage, sin grid agresivo.
 * Recibe array de { fecha, valor } y dibuja line + área debajo.
 *
 * Diseño: línea continua, área con opacidad 0.15, puntos solo donde
 * cambia de intensidad o en hover (que no aplica en RN simple).
 */
import { View } from 'react-native';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { colors, fontFamily } from '@/lib/theme';

export interface IntensidadChartProps {
  data: Array<{ fecha: string; valor: number }>;
  width: number;
  height?: number;
  /** valor máximo del eje Y. Default 5 (escala de intensidad NOEMA). */
  yMax?: number;
}

export function IntensidadChart({
  data,
  width,
  height = 180,
  yMax = 5,
}: IntensidadChartProps) {
  if (data.length === 0) return <View style={{ width, height }} />;

  const padding = { top: 16, right: 16, bottom: 24, left: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const n = data.length;
  const stepX = n > 1 ? chartW / (n - 1) : chartW;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - (d.valor / yMax) * chartH,
    valor: d.valor,
    fecha: d.fecha,
  }));

  // Path de la línea
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Path del área (cierra hasta el bottom)
  const areaPath =
    linePath +
    ` L ${points[points.length - 1]!.x.toFixed(1)} ${padding.top + chartH}` +
    ` L ${points[0]!.x.toFixed(1)} ${padding.top + chartH} Z`;

  // Líneas guía Y (0, 2.5, 5)
  const ticks = [0, yMax / 2, yMax];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.noemaSage} stopOpacity={0.2} />
          <Stop offset="1" stopColor={colors.noemaSage} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>

      {/* Tick lines + labels Y */}
      {ticks.map((t) => {
        const y = padding.top + chartH - (t / yMax) * chartH;
        return (
          <G key={t}>
            <Line
              x1={padding.left}
              x2={padding.left + chartW}
              y1={y}
              y2={y}
              stroke="rgba(46, 59, 46, 0.06)"
              strokeWidth={1}
            />
            <SvgText
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={10}
              fontFamily={fontFamily.sansRegular}
              fill="#5C6B5A"
            >
              {t}
            </SvgText>
          </G>
        );
      })}

      {/* Área */}
      <Path d={areaPath} fill="url(#areaFill)" />

      {/* Línea */}
      <Path
        d={linePath}
        stroke={colors.noemaSage}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Puntos: primero y último siempre, intermedios solo si pocos */}
      {points.length <= 10 &&
        points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={colors.bone}
            stroke={colors.noemaSage}
            strokeWidth={1.5}
          />
        ))}
    </Svg>
  );
}
