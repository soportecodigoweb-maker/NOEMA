import type { SVGProps } from 'react';

export interface VesicaProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Símbolo NOEMA — dos círculos en vesica piscis.
 * Versión web del componente.
 */
export function Vesica({
  size = 32,
  color = 'currentColor',
  strokeWidth = 1.5,
  ...props
}: VesicaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NOEMA"
      {...props}
    >
      <circle cx="48" cy="60" r="36" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="72" cy="60" r="36" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  );
}
