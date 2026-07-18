import { ShieldCheck } from 'lucide-react';
import {
  AVISO_CONFIDENCIALIDAD_TERAPEUTA,
  VERSION_AVISO,
} from '@/lib/aviso-confidencialidad';
import { AceptarAvisoForm } from './AceptarAvisoForm';

export const metadata = { title: 'Aviso de confidencialidad' };

export default function AvisoConfidencialidadPage() {
  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
          <ShieldCheck className="size-5 text-noema-sage" strokeWidth={1.7} />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-ink">Aviso de confidencialidad</h1>
          <p className="text-sm text-foreground-muted">
            Antes de continuar, lee y acepta tus responsabilidades como profesional.
          </p>
        </div>
      </div>

      <div className="max-h-[50vh] space-y-5 overflow-y-auto rounded-xl border border-noema-deep/10 bg-white p-6">
        {AVISO_CONFIDENCIALIDAD_TERAPEUTA.map((seccion) => (
          <section key={seccion.titulo}>
            <h2 className="mb-1.5 font-medium text-ink">{seccion.titulo}</h2>
            {seccion.parrafos.map((p, i) => (
              <p key={i} className="mb-2 text-sm leading-relaxed text-ink/75">
                {p}
              </p>
            ))}
          </section>
        ))}
        <p className="border-t border-noema-deep/8 pt-4 text-xs text-foreground-muted">
          Versión del aviso: {VERSION_AVISO}. Documento borrador sujeto a revisión legal.
        </p>
      </div>

      <AceptarAvisoForm />
    </div>
  );
}
