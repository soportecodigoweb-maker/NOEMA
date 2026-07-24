import {
  Leaf,
  Wind,
  CloudRain,
  BatteryLow,
  Sun,
  Smile,
  Heart,
  Moon,
  Sparkles,
  CloudDrizzle,
  Flame,
  Coffee,
  HeartHandshake,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

/** Color de fondo suave por familia emocional (tokens de NOEMA). */
export const FAMILIA_BG: Record<string, string> = {
  tranquilo: 'bg-emotion-tranquilo/50 text-noema-deep',
  feliz: 'bg-emotion-feliz/50 text-noema-deep',
  ansioso: 'bg-emotion-ansioso/50 text-noema-deep',
  triste: 'bg-emotion-triste/50 text-noema-deep',
  cansado: 'bg-emotion-cansado/50 text-noema-deep',
};

/** Punto de color por familia (para chips pequeños). */
export const FAMILIA_PUNTO: Record<string, string> = {
  tranquilo: 'bg-emotion-tranquilo',
  feliz: 'bg-emotion-feliz',
  ansioso: 'bg-emotion-ansioso',
  triste: 'bg-emotion-triste',
  cansado: 'bg-emotion-cansado',
};

/** Icono específico por emoción; si no hay, cae al de su familia. */
const ICONO_POR_KEY: Record<string, LucideIcon> = {
  // tranquilo
  tranquilo: Leaf,
  en_paz: Leaf,
  agradecido: HeartHandshake,
  descansado: Moon,
  en_equilibrio: Leaf,
  // ansioso
  ansioso: Wind,
  preocupado: Wind,
  alerta: Flame,
  inquieto: Wind,
  abrumado: CloudDrizzle,
  // triste
  triste: CloudRain,
  melancolico: CloudRain,
  solo: CloudRain,
  vacio: CloudDrizzle,
  en_duelo: CloudRain,
  // cansado
  cansado: BatteryLow,
  agotado: BatteryLow,
  con_sueno: Coffee,
  sobrecargado: BatteryLow,
  apagado: Moon,
  // feliz
  feliz: Smile,
  satisfecho: Sun,
  entusiasmado: Sparkles,
  conectado: Heart,
  orgulloso: Trophy,
};

const ICONO_POR_FAMILIA: Record<string, LucideIcon> = {
  tranquilo: Leaf,
  feliz: Smile,
  ansioso: Wind,
  triste: CloudRain,
  cansado: BatteryLow,
};

export function iconoDeEmocion(key: string, familia?: string): LucideIcon {
  return ICONO_POR_KEY[key] ?? ICONO_POR_FAMILIA[familia ?? ''] ?? Heart;
}

/** Badge redondo con el icono de la emoción, coloreado por familia. */
export function IconoEmocion({
  emocionKey,
  familia,
  size = 36,
}: {
  emocionKey: string;
  familia?: string;
  size?: number;
}) {
  const Icono = iconoDeEmocion(emocionKey, familia);
  const bg = FAMILIA_BG[familia ?? ''] ?? 'bg-noema-sage/15 text-noema-deep';
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${bg}`}
      style={{ width: size, height: size }}
    >
      <Icono style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.7} />
    </span>
  );
}
