import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  MousePointerClick,
  RotateCcw,
  Stethoscope,
  Smartphone,
} from 'lucide-react';
import { Vesica } from '@/components/ui/Vesica';
import type { RolDemo } from '@/lib/demo/constantes';

interface PageProps {
  params: Promise<{ rol: string }>;
  searchParams: Promise<{ error?: string }>;
}

export function generateMetadata({ params }: { params: Promise<{ rol: string }> }) {
  return params.then(({ rol }) => ({
    title: rol === 'paciente' ? 'Demo del paciente' : 'Demo del psicólogo',
  }));
}

/**
 * Hub del demo por rol: video demo y cuenta demo (sandbox), sin cuenta
 * maestra. Es el equivalente público de la página de Demos de Operana.
 */
export default async function DemoRolPage({ params, searchParams }: PageProps) {
  const { rol: r } = await params;
  const { error } = await searchParams;
  if (r !== 'psicologo' && r !== 'paciente') notFound();
  const rol = r as RolDemo;
  const otro: RolDemo = rol === 'psicologo' ? 'paciente' : 'psicologo';
  const esPsic = rol === 'psicologo';

  return (
    <main className="min-h-screen bg-[#1D271E] text-bone">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 text-sm text-bone/70 hover:text-bone"
          >
            <ArrowLeft className="size-4" /> Volver al inicio de sesión
          </Link>
          <span className="flex items-center gap-3">
            <Vesica size={24} color="rgba(250, 247, 241, 0.9)" strokeWidth={1.5} />
            <span className="font-serif text-lg tracking-[0.34em]">NOEMA</span>
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-14">
          <p className="demo-anim-bajar font-mono text-[11px] uppercase tracking-[0.32em] text-[#E2B6A5]">
            {String(esPsic ? '01' : '02')} · Demo {esPsic ? 'del psicólogo' : 'del paciente'}
          </p>
          <h1 className="demo-anim-subir mt-4 max-w-3xl font-serif text-5xl leading-[1.04] sm:text-6xl">
            {esPsic
              ? 'Tu consulta, como si ya la usaras.'
              : 'Su proceso, como lo vive tu paciente.'}
          </h1>
          <p
            className="demo-anim-subir mt-5 max-w-2xl text-lg leading-relaxed text-bone/70"
            style={{ animationDelay: '0.1s' }}
          >
            {esPsic
              ? 'Una psicóloga demo con cuatro pacientes y tres meses de historia real. Míralo en video o entra y muévele tú.'
              : 'Mariana, una paciente demo con tres meses de proceso. Mira cómo se ve de su lado, o entra y registra tú.'}
          </p>

          {error && (
            <p className="mt-6 max-w-xl rounded-xl border border-[#E2B6A5]/40 bg-[#E2B6A5]/10 px-4 py-3 text-sm text-bone/85">
              {error === 'ocupado'
                ? 'Muchas personas están probando el demo en este momento. Intenta de nuevo en unos minutos.'
                : 'El demo no está disponible por ahora. Intenta más tarde.'}
            </p>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href={`/demo/video/${rol}`}
              className="demo-anim-capa group rounded-2xl border border-bone/12 bg-bone/[0.04] p-6 transition-colors hover:bg-bone/[0.08]"
              style={{ animationDelay: '0.15s' }}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-[#E2B6A5] text-[#1D271E]">
                <Play className="ml-0.5 size-5" strokeWidth={2} />
              </span>
              <h2 className="mt-5 font-serif text-2xl">Video demo</h2>
              <p className="mt-2 text-sm leading-relaxed text-bone/65">
                {esPsic ? '12 diapositivas' : '11 diapositivas'} con la app real operándose sola.
                Unos 3 minutos.
              </p>
            </Link>
            <Link
              href={`/demo/entrar?rol=${rol}&a=${encodeURIComponent(esPsic ? '/inicio?recorrido=1' : '/paciente?recorrido=1')}`}
              className="demo-anim-capa group rounded-2xl border border-bone/12 bg-bone/[0.04] p-6 transition-colors hover:bg-bone/[0.08]"
              style={{ animationDelay: '0.25s' }}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-bone text-[#1D271E]">
                <MousePointerClick className="size-5" strokeWidth={2} />
              </span>
              <h2 className="mt-5 font-serif text-2xl">Cuenta demo</h2>
              <p className="mt-2 text-sm leading-relaxed text-bone/65">
                Entra a la app real con un recorrido guiado. Puedes moverle a todo: es tu copia.
              </p>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-bone/55">
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="size-4" /> Cada visitante tiene su propia copia. Todo se
              reinicia solo cada día.
            </span>
            <Link
              href={`/demo/${otro}`}
              className="inline-flex items-center gap-2 text-bone/80 underline-offset-4 hover:underline"
            >
              {otro === 'paciente' ? (
                <Smartphone className="size-4" />
              ) : (
                <Stethoscope className="size-4" />
              )}
              Ver el demo {otro === 'paciente' ? 'del paciente' : 'del psicólogo'}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
