import type { ReactNode } from 'react';
import { Vesica } from '@/components/ui/Vesica';

export interface HojaMembretadaProps {
  titulo: string;
  subtitulo?: string | null;
  /** Etiqueta de categoría o tipo, arriba a la derecha del membrete. */
  etiqueta?: string | null;
  /** Pie de página opcional (por defecto: aviso NOEMA). */
  pie?: ReactNode;
  children: ReactNode;
}

/**
 * Hoja con membrete NOEMA — da a recursos, formatos y tareas un aspecto de
 * documento profesional (papelería membretada) en lugar de una tarjeta genérica.
 * Se usa igual para mostrar un formato y para que el paciente lo conteste, de
 * modo que la respuesta quede en el mismo formato (requerimiento #2).
 */
export function HojaMembretada({
  titulo,
  subtitulo,
  etiqueta,
  pie,
  children,
}: HojaMembretadaProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-noema-deep/12 bg-white shadow-[0_1px_0_rgba(43,54,47,0.04),0_18px_40px_-28px_rgba(43,54,47,0.35)]">
      {/* Membrete */}
      <header className="flex items-center justify-between gap-4 border-b border-noema-deep/10 bg-gradient-to-b from-bone/60 to-white px-6 py-5 sm:px-9 sm:py-6">
        <div className="flex items-center gap-3">
          <Vesica size={30} color="#2E3B2E" strokeWidth={1.4} />
          <div className="leading-none">
            <p className="font-serif text-lg tracking-[0.34em] text-noema-deep">NOEMA</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-noema-sage/80">
              Acompañamiento terapéutico
            </p>
          </div>
        </div>
        {etiqueta && (
          <span className="shrink-0 rounded-full border border-noema-deep/12 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-noema-deep/60">
            {etiqueta}
          </span>
        )}
      </header>

      {/* Título del documento */}
      <div className="px-6 pt-6 sm:px-9 sm:pt-8">
        <h2 className="font-serif text-2xl leading-tight text-ink sm:text-[1.7rem]">
          {titulo}
        </h2>
        {subtitulo && (
          <p className="mt-1.5 max-w-prose text-sm text-foreground-muted">{subtitulo}</p>
        )}
        <div className="mt-5 h-px w-full bg-gradient-to-r from-noema-deep/15 via-noema-deep/8 to-transparent" />
      </div>

      {/* Cuerpo */}
      <div className="px-6 py-6 sm:px-9 sm:py-7">{children}</div>

      {/* Pie */}
      <footer className="border-t border-noema-deep/8 bg-bone/40 px-6 py-3.5 sm:px-9">
        {pie ?? (
          <p className="text-[11px] leading-relaxed text-foreground-muted">
            Documento generado en NOEMA · La información marcada como privada por el
            paciente no es visible para el terapeuta.
          </p>
        )}
      </footer>
    </article>
  );
}
