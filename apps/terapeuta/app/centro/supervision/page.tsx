import { Eye } from 'lucide-react';

export const metadata = { title: 'Supervisión · Centro' };

export default function SupervisionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Eye className="size-7 text-noema-sage" /> Supervisión clínica
        </h1>
        <p className="text-sm text-foreground-muted">
          Supervisa el proceso de los pacientes de tus terapeutas, con su autorización.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center">
        <p className="text-sm text-foreground-muted">
          La supervisión clínica se está construyendo. Incluirá la opción de activarla para tu
          centro, la autorización de cada terapeuta y el desglose del proceso de cada paciente con
          tus observaciones.
        </p>
      </div>
    </div>
  );
}
