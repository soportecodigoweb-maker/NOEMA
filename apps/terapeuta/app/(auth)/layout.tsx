import { Vesica } from '@/components/ui/Vesica';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-noema-deep p-12 text-bone">
        <div className="flex items-center gap-3">
          <Vesica size={28} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-[0.34em]">NOEMA</span>
        </div>

        <div className="space-y-6 max-w-md">
          <p className="font-serif text-4xl leading-tight">
            Tu proceso continúa<br />acompañado.
          </p>
          <p className="text-bone/70 leading-relaxed">
            Da seguimiento real a tus pacientes entre sesiones. Organiza,
            registra y prepara mejor cada consulta — sin convertirte en
            terapeuta 24/7.
          </p>
        </div>

        <p className="text-xs text-bone/40">
          NOEMA · Plataforma de seguimiento terapéutico entre sesiones
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
