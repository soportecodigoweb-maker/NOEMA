import Link from 'next/link';
import { Vesica } from '@/components/ui/Vesica';

export const metadata = {
  title: 'Términos de servicio',
  description: 'Términos legales de uso de NOEMA.',
};

export default function TerminosPage() {
  return (
    <article className="min-h-screen bg-paper">
      <header className="px-8 py-6 border-b border-noema-deep/[0.06] flex items-center gap-3 text-noema-deep">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80">
          <Vesica size={24} color="currentColor" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-[0.34em]">NOEMA</span>
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-ink">
        <h1 className="font-serif text-4xl mb-2">Términos de servicio</h1>
        <p className="text-sm text-foreground-muted">
          Última actualización: enero 2026
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">1. Sobre NOEMA</h2>
          <p>
            NOEMA es una plataforma digital que facilita el seguimiento entre
            sesiones terapéuticas. Es una herramienta operativa, NO un servicio
            de atención clínica, NO un canal de emergencia y NO sustituye la
            consulta profesional ni los servicios de urgencia.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">2. Quién puede usarla</h2>
          <p>
            <strong>Terapeutas:</strong> profesionales de la salud mental con
            formación reconocida (licenciatura mínima) que aceptan utilizar la
            plataforma bajo principios éticos de su profesión.
          </p>
          <p>
            <strong>Pacientes:</strong> mayores de edad. Los menores requieren
            consentimiento de su tutor legal y firma del terapeuta tratante.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">3. Crisis y emergencias</h2>
          <p>
            <strong>
              NOEMA no es un servicio de atención de emergencia.
            </strong>{' '}
            Si tú o alguien que conoces está en peligro inmediato, llama a los
            servicios de emergencia locales (911 en México) o a una línea
            profesional de crisis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">4. Privacidad del paciente</h2>
          <p>
            El paciente decide qué información comparte con su terapeuta. La
            información marcada como privada es estrictamente inaccesible para
            el terapeuta y para los sistemas de IA de NOEMA. Ver{' '}
            <Link href="/privacidad" className="text-noema-sage hover:underline">
              Aviso de Privacidad
            </Link>{' '}
            para detalles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">5. Uso de IA</h2>
          <p>
            NOEMA usa modelos de lenguaje (Claude de Anthropic) para generar
            resúmenes operativos. Los resúmenes son sugerencias para preparar
            sesiones, no diagnósticos clínicos. El criterio profesional del
            terapeuta siempre prevalece.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">6. Plan y cobros (terapeutas)</h2>
          <p>
            La suscripción cuesta $100 MXN por paciente activo por mes, con 30
            días de prueba gratuita. La facturación es manejada por Stripe.
            Puedes cancelar en cualquier momento desde tus ajustes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">7. Responsabilidad</h2>
          <p>
            El terapeuta es responsable del uso clínico que haga de la
            información dentro de la plataforma. NOEMA no se hace responsable de
            decisiones terapéuticas tomadas con base en los datos o resúmenes IA
            del sistema.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">8. Cambios en los términos</h2>
          <p>
            Te avisaremos por correo o dentro de la app si modificamos
            sustancialmente estos términos.
          </p>
        </section>

        <section className="space-y-3 pt-8 border-t border-noema-deep/[0.06]">
          <h2 className="font-serif text-2xl">Contacto</h2>
          <p>
            Para dudas o solicitudes: <strong>hola@noema.app</strong>
          </p>
        </section>
      </div>
    </article>
  );
}
