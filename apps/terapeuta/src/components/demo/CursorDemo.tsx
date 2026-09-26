'use client';

/** Cursor simulado que "opera" la app durante el demo. */
export function CursorDemo({
  x,
  y,
  visible,
  clic,
}: {
  x: number;
  y: number;
  visible: boolean;
  clic: number;
}) {
  return (
    <div
      className="demo-cursor"
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <span key={clic} className={`demo-cursor-onda ${clic ? 'activa' : ''}`} />
      <svg width="26" height="30" viewBox="0 0 26 30" style={{ marginLeft: -3, marginTop: -2 }}>
        <path
          d="M3 2 L3 24 L9 18.5 L13 27 L17 25.2 L13.2 16.8 L21 16.5 Z"
          fill="#FAF7F1"
          stroke="#2A3328"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
