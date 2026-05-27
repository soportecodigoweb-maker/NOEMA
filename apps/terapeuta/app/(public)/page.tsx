import Link from 'next/link';
import { ArrowRight, Sparkles, Lock, Heart } from 'lucide-react';
import { Vesica } from '@/components/ui/Vesica';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'NOEMA · Tu proceso continúa acompañado',
  description:
    'Plataforma de seguimiento terapéutico entre sesiones. Para pacientes en proceso y terapeutas que acompañan.',
};

// ISR: regenera el HTML cada 60s para reflejar nuevos terapeutas verificados
export const revalidate = 60;

export default async function LandingPage() {
  const supabase = await createClient();
  const { count: terapeutasCount } = await supabase
    .from('terapeutas')
    .select('*', { count: 'exact', head: true })
    .eq('estado_verificacion', 'verificado');

  return (
    <>
      {/* Hero */}
      <section className="bg-noema-deep text-bone">
        <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32">
          <div className="flex items-center gap-3 mb-8 opacity-80">
            <Vesica size={32} color="rgba(250, 247, 241, 0.8)" strokeWidth={1.3} />
            <span className="caption text-bone/70">PLATAFORMA</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight max-w-4xl">
            Tu proceso<br />continúa<br />acompañado.
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-bone/75 leading-relaxed max-w-2xl">
            Lo que ocurre entre sesiones también es parte del trabajo terapéutico.
            NOEMA da continuidad a tu proceso sin convertirte en un usuario más
            de una app.
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/terapeutas">
              <Button variant="inverse" size="lg">
                Encuentra un terapeuta
                <ArrowRight className="size-4" strokeWidth={1.8} />
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="ghost" size="lg" className="text-bone hover:bg-bone/10">
                Soy terapeuta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tres principios */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="caption mb-3">Nuestros principios</p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink mb-10 max-w-2xl">
          Tecnología que sostiene un proceso humano.
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <Card variant="flat">
            <Lock className="size-6 text-noema-sage mb-3" strokeWidth={1.6} />
            <h3 className="font-sans font-semibold text-ink mb-2">
              Tu información es tuya
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Tú decides qué compartir con tu terapeuta. Lo marcado como privado
              es inviolable, incluso para nuestros sistemas.
            </p>
          </Card>
          <Card variant="flat">
            <Heart className="size-6 text-noema-sage mb-3" strokeWidth={1.6} />
            <h3 className="font-sans font-semibold text-ink mb-2">
              No reemplaza a tu terapeuta
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              NOEMA no es chat 24/7 ni atención de emergencia. Es una herramienta
              que fortalece la continuidad del proceso, no lo sustituye.
            </p>
          </Card>
          <Card variant="flat">
            <Sparkles className="size-6 text-noema-sage mb-3" strokeWidth={1.6} />
            <h3 className="font-sans font-semibold text-ink mb-2">
              IA operativa, no diagnóstica
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Nuestra IA ayuda al terapeuta a preparar sesión, no toma decisiones
              clínicas. El criterio profesional siempre prevalece.
            </p>
          </Card>
        </div>
      </section>

      {/* Para pacientes */}
      <section className="bg-bone/40 py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="caption mb-3">Para pacientes</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-ink mb-4">
              Registra lo que vives. <br />En sesión, recuerdas mejor.
            </h2>
            <p className="text-foreground-muted leading-relaxed mb-6">
              Las emociones, detonantes y momentos importantes ocurren fuera de
              la sesión. NOEMA te ayuda a registrarlos en pocos segundos, y a
              decidir con calma qué quieres compartir.
            </p>
            <ul className="space-y-2 text-sm text-ink/80">
              <li className="flex gap-2"><span className="text-noema-sage">·</span> Registro emocional rápido con privacidad por entrada.</li>
              <li className="flex gap-2"><span className="text-noema-sage">·</span> Diario personal con niveles de compartir.</li>
              <li className="flex gap-2"><span className="text-noema-sage">·</span> Módulo de crisis con líneas de emergencia.</li>
              <li className="flex gap-2"><span className="text-noema-sage">·</span> Análisis de tu propio bienestar, semana a semana.</li>
            </ul>
          </div>
          <Card>
            <p className="caption mb-2">Disponible para tu celular</p>
            <h3 className="font-serif text-2xl mb-3">App iOS y Android</h3>
            <p className="text-sm text-foreground-muted mb-5">
              Descarga la app gratis. Funciona incluso sin terapeuta — explora
              contenido de bienestar y encuentra al profesional cuando estés listo.
            </p>
            <div className="flex gap-2">
              <span className="caption bg-foreground-muted/10 px-3 py-1.5 rounded text-foreground-muted">
                Próximamente App Store
              </span>
              <span className="caption bg-foreground-muted/10 px-3 py-1.5 rounded text-foreground-muted">
                Próximamente Google Play
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Para terapeutas */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <Card variant="inverse">
            <p className="caption text-bone/70 mb-2">Para terapeutas</p>
            <h3 className="font-serif text-2xl text-bone mb-3">
              30 días gratis. Sin tarjeta para empezar.
            </h3>
            <p className="text-sm text-bone/80 mb-5">
              Después: $100 MXN por paciente activo por mes. Pacientes ilimitados,
              IA pre-sesión incluida.
            </p>
            <Link href="/signup">
              <Button variant="inverse" size="md">
                Crear cuenta de terapeuta
                <ArrowRight className="size-4" strokeWidth={1.8} />
              </Button>
            </Link>
          </Card>
          <div>
            <p className="caption mb-3">Para terapeutas</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-ink mb-4">
              Acompañas mejor cuando ves lo que ocurre entre sesiones.
            </h2>
            <p className="text-foreground-muted leading-relaxed mb-6">
              Llega a cada consulta con un panorama claro: emociones registradas,
              momentos significativos, tareas asignadas y un resumen IA listo
              para preparar la sesión.
            </p>
            <ul className="space-y-2 text-sm text-ink/80">
              <li className="flex gap-2"><span className="text-noema-sage">·</span> Panel limpio con pacientes, sesiones y mensajes.</li>
              <li className="flex gap-2"><span className="text-noema-sage">·</span> Biblioteca de ejercicios y plantillas oficiales.</li>
              <li className="flex gap-2"><span className="text-noema-sage">·</span> IA opcional que respeta privacidad del paciente.</li>
              <li className="flex gap-2"><span className="text-noema-sage">·</span> Directorio público para que pacientes te encuentren.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bone/40 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <p className="caption mb-3">Preguntas frecuentes</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink mb-10">
            Lo que probablemente te preguntas.
          </h2>

          <div className="space-y-1">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group border-b border-noema-deep/[0.08] py-5"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="font-sans font-medium text-ink text-lg pr-4">
                    {f.q}
                  </h3>
                  <span className="text-2xl text-foreground-muted font-light transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="mt-3 text-foreground-muted leading-relaxed text-[15px]">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-noema-deep text-bone">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <Vesica
            size={48}
            color="rgba(250, 247, 241, 0.5)"
            strokeWidth={1.3}
            className="mx-auto mb-6"
          />
          <h2 className="font-serif text-3xl sm:text-4xl text-bone mb-4">
            Tu proceso continúa.
          </h2>
          <p className="text-bone/75 mb-8 max-w-xl mx-auto">
            {terapeutasCount && terapeutasCount > 0 ? (
              <>
                Ya hay {terapeutasCount} terapeutas verificados acompañando procesos
                en NOEMA. Encuentra el tuyo o únete como profesional.
              </>
            ) : (
              <>
                Una nueva forma de mantener vivo el trabajo terapéutico entre
                consultas. Empieza hoy.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/terapeutas">
              <Button variant="inverse" size="lg">
                Ver directorio
                <ArrowRight className="size-4" strokeWidth={1.8} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const faqs: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: '¿NOEMA es un chat con mi terapeuta?',
    a: 'No. NOEMA no es atención en tiempo real ni chat 24/7. Tu terapeuta responde mensajes de forma asíncrona, dentro de sus horarios. Para emergencias, la app te conecta con líneas profesionales.',
  },
  {
    q: '¿Mi terapeuta ve todo lo que escribo?',
    a: 'Solo lo que tú decidas. Cada registro y entrada de diario tiene un nivel: privado (solo tú), compartido (tu terapeuta), o marcado para sesión (destacado en consulta). Lo privado es inviolable.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: (
      <>
        Para pacientes: <strong>gratis</strong>. Para terapeutas: $100 MXN por paciente
        activo por mes, con 30 días de prueba sin tarjeta. Sin tope de pacientes.
      </>
    ),
  },
  {
    q: '¿Funciona si no tengo terapeuta todavía?',
    a: 'Sí. Puedes usar la app en modo exploración: acceso a contenido educativo, biblioteca de meditaciones y lecturas, y nuestro directorio de profesionales verificados.',
  },
  {
    q: '¿La inteligencia artificial reemplaza el criterio del terapeuta?',
    a: 'No. La IA genera resúmenes operativos para preparar sesión. Nunca diagnostica ni interpreta. El terapeuta siempre tiene acceso a la información original y su criterio profesional prevalece.',
  },
  {
    q: '¿Cómo se garantiza la verificación de los terapeutas?',
    a: 'Cada terapeuta sube su cédula profesional, que validamos manualmente antes de marcarlo como verificado en el directorio. Solo terapeutas verificados aparecen en la búsqueda pública.',
  },
  {
    q: '¿Qué pasa si quiero borrar mi cuenta?',
    a: 'Puedes hacerlo desde Ajustes en cualquier momento. La cuenta se cierra de inmediato y todos tus datos se eliminan en 7 días (período de gracia por si te arrepientes).',
  },
];
