import Link from 'next/link';
import '@/components/demo/demo.css';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Play,
  MousePointerClick,
  ShieldCheck,
  Activity,
  Sparkles,
  LifeBuoy,
  ClipboardCheck,
  FileCheck2,
} from 'lucide-react';
import { Vesica } from '@/components/ui/Vesica';

export const metadata: Metadata = {
  title: 'NOEMA · Tu proceso continúa acompañado',
  description:
    'Seguimiento terapéutico entre sesiones. Mira el demo del psicólogo y el del paciente sin crear cuenta.',
  robots: { index: true, follow: true },
};

const PUNTOS = [
  {
    icon: ShieldCheck,
    t: 'La privacidad es decisión del paciente, registro por registro.',
    d: 'Privado, compartido o marcado para sesión. El psicólogo solo ve lo que el paciente decide.',
  },
  {
    icon: Activity,
    t: 'El proceso no se detiene entre sesiones.',
    d: 'Lo que el paciente registra le aparece al psicólogo cuando pasa, con aviso en su teléfono.',
  },
  {
    icon: Sparkles,
    t: 'IA con límites en el código, no en promesas.',
    d: 'Resume, organiza y redacta; nunca diagnostica ni sugiere tratamiento. La IA organiza, el profesional interpreta.',
  },
  {
    icon: LifeBuoy,
    t: 'Plan de apoyo en lugar de botón de pánico.',
    d: 'Un plan armado en sesión. Si el paciente lo usa, su psicólogo se entera y NOEMA lo lleva a ayuda real.',
  },
  {
    icon: ClipboardCheck,
    t: 'Tareas con formato y retroalimentación.',
    d: 'Escalas, campos y fechas. El paciente responde desde su teléfono; el psicólogo comenta cada respuesta.',
  },
  {
    icon: FileCheck2,
    t: 'Cumplimiento mexicano de fábrica.',
    d: 'Expediente con los rubros de la NOM-004, consentimiento informado y aviso de privacidad.',
  },
];

/**
 * Página web pública, en el mismo dominio que la app. No es una landing
 * tradicional: es la entrada a los dos demos. La versión inmersiva completa
 * es un bloque aparte, después de las 34 fases del demo.
 */
export default function WebPage() {
  return (
    <main className="min-h-screen bg-[#1D271E] text-bone">
      <header className="sticky top-0 z-30 border-b border-bone/10 bg-[#1D271E]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-3">
            <Vesica size={24} color="rgba(250, 247, 241, 0.9)" strokeWidth={1.5} />
            <span className="font-serif text-lg tracking-[0.34em]">NOEMA</span>
          </span>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/signin" className="rounded-md px-3 py-2 text-bone/80 hover:bg-bone/10">
              Iniciar sesión
            </Link>
            <Link
              href="/demo/psicologo"
              className="rounded-md bg-bone px-3 py-2 font-medium text-[#1D271E] hover:bg-bone/90"
            >
              Ver el demo
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="demo-video-aro" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 sm:pt-32">
          <p className="demo-anim-bajar font-mono text-[11px] uppercase tracking-[0.32em] text-[#E2B6A5]">
            Seguimiento terapéutico entre sesiones
          </p>
          <h1 className="demo-anim-subir mt-5 max-w-4xl font-serif text-5xl leading-[1.02] sm:text-7xl">
            Lo que pasa entre el martes y el martes también es terapia.
          </h1>
          <p
            className="demo-anim-subir mt-7 max-w-2xl text-lg leading-relaxed text-bone/70"
            style={{ animationDelay: '0.1s' }}
          >
            NOEMA da continuidad al proceso: el paciente registra desde su teléfono y decide qué
            comparte; el psicólogo lo ve cuando pasa y llega a cada sesión con todo ordenado.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            <Link
              href="/demo/psicologo"
              className="demo-anim-capa group rounded-2xl border border-bone/12 bg-bone/[0.04] p-6 transition-colors hover:bg-bone/[0.08]"
              style={{ animationDelay: '0.15s' }}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-[#E2B6A5] text-[#1D271E]">
                <Play className="ml-0.5 size-5" />
              </span>
              <h2 className="mt-5 font-serif text-2xl">Demo del psicólogo</h2>
              <p className="mt-2 text-sm text-bone/65">
                Video de 12 diapositivas y una cuenta demo para moverle tú.
              </p>
            </Link>
            <Link
              href="/demo/paciente"
              className="demo-anim-capa group rounded-2xl border border-bone/12 bg-bone/[0.04] p-6 transition-colors hover:bg-bone/[0.08]"
              style={{ animationDelay: '0.25s' }}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-bone text-[#1D271E]">
                <MousePointerClick className="size-5" />
              </span>
              <h2 className="mt-5 font-serif text-2xl">Demo del paciente</h2>
              <p className="mt-2 text-sm text-bone/65">
                Cómo se ve y qué puede hacer tu paciente desde su teléfono.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-bone/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[#E2B6A5]">
            Lo que casi nadie tiene
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PUNTOS.map((p, i) => (
              <div key={i} className="rounded-2xl border border-bone/10 bg-bone/[0.03] p-6">
                <p.icon className="size-5 text-[#E2B6A5]" strokeWidth={1.7} />
                <h3 className="mt-4 font-serif text-xl leading-snug">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bone/65">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/demo/psicologo"
              className="inline-flex items-center gap-2 rounded-md bg-bone px-5 py-3 font-medium text-[#1D271E] hover:bg-bone/90"
            >
              Ver el demo <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md border border-bone/20 px-5 py-3 text-bone/90 hover:bg-bone/10"
            >
              Crear mi cuenta
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-bone/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-bone/50">
          <span>NOEMA © 2026 · Plataforma de seguimiento terapéutico entre sesiones</span>
          <nav className="flex gap-5">
            <Link href="/terminos" className="hover:text-bone">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-bone">
              Privacidad
            </Link>
            <Link href="/terapeutas" className="hover:text-bone">
              Directorio
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
