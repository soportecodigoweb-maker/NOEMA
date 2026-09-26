'use client';

/** Título que entra palabra por palabra, cada una desenfocada y enfocándose. */
export function TituloPalabras({
  texto,
  retrasoMs = 350,
  pasoMs = 110,
  className,
}: {
  texto: string;
  retrasoMs?: number;
  pasoMs?: number;
  className?: string;
}) {
  const palabras = texto.split(' ');
  return (
    <span className={className} aria-label={texto}>
      {palabras.map((p, i) => (
        <span
          key={`${i}-${p}`}
          className="demo-palabra"
          style={{ animationDelay: `${retrasoMs + i * pasoMs}ms` }}
          aria-hidden
        >
          {p}
          {i < palabras.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}
