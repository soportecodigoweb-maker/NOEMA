import Link from 'next/link';
import { Globe, Stethoscope, Smartphone, ArrowUpRight } from 'lucide-react';

/**
 * Entrada pública al demo desde el login, sin iniciar sesión: la página web
 * (arriba, la más visible) y los dos demos por rol.
 */
export function BotonesDemo() {
  const item =
    'group flex items-center gap-3 rounded-xl border border-noema-deep/10 bg-white px-4 py-3 text-left transition-colors hover:border-noema-sage/50 hover:bg-bone';
  return (
    <div className="space-y-3">
      <Link
        href="/web"
        className="group flex items-center justify-between gap-3 rounded-xl bg-noema-deep px-4 py-3.5 text-bone transition-colors hover:bg-noema-sage"
      >
        <span className="flex items-center gap-3">
          <Globe className="size-5 opacity-90" strokeWidth={1.7} />
          <span>
            <span className="block text-[15px] font-medium">Conoce NOEMA</span>
            <span className="block text-xs text-bone/70">Página web con el demo completo</span>
          </span>
        </span>
        <ArrowUpRight className="size-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-noema-deep/10" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
          Pruébala sin cuenta
        </span>
        <span className="h-px flex-1 bg-noema-deep/10" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/demo/psicologo" className={item}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
            <Stethoscope className="size-4" strokeWidth={1.8} />
          </span>
          <span>
            <span className="block text-sm font-medium text-ink">Demo del psicólogo</span>
            <span className="block text-[11px] text-foreground-muted">
              El panel, con una consulta real
            </span>
          </span>
        </Link>
        <Link href="/demo/paciente" className={item}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/12 text-noema-sage">
            <Smartphone className="size-4" strokeWidth={1.8} />
          </span>
          <span>
            <span className="block text-sm font-medium text-ink">Demo del paciente</span>
            <span className="block text-[11px] text-foreground-muted">
              La app, como la vive tu paciente
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
