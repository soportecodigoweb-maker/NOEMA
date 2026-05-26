import Link from 'next/link';
import { Vesica } from '@/components/ui/Vesica';

export const metadata = {
  title: 'Aviso de privacidad',
  description: 'Cómo NOEMA recopila, usa y protege tu información.',
};

export default function PrivacidadPage() {
  return (
    <article className="min-h-screen bg-paper">
      <header className="px-8 py-6 border-b border-noema-deep/[0.06] flex items-center gap-3 text-noema-deep">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80">
          <Vesica size={24} color="currentColor" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-[0.34em]">NOEMA</span>
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6 text-ink">
        <h1 className="font-serif text-4xl mb-2">Aviso de privacidad</h1>
        <p className="text-sm text-foreground-muted">Última actualización: enero 2026</p>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">Responsable</h2>
          <p>
            NOEMA (en adelante "nosotros") es responsable del tratamiento de tus
            datos personales según la Ley Federal de Protección de Datos
            Personales en Posesión de los Particulares (México).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">Datos que recopilamos</h2>
          <p>
            <strong>De terapeutas:</strong> nombre, correo, cédula profesional,
            título, descripción, especialidades, ciudad, datos de pago (vía
            Stripe — nosotros no almacenamos tu tarjeta).
          </p>
          <p>
            <strong>De pacientes:</strong> nombre, correo, registros emocionales
            que tú decidas compartir, entradas de diario que tú decidas
            compartir, respuestas a tareas, mensajes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">Las 3 reglas de privacidad de NOEMA</h2>
          <ol className="list-decimal ml-6 space-y-2">
            <li>
              <strong>Tú decides qué compartir.</strong> Cada registro y entrada
              de diario tiene un nivel: privado (solo tú), compartido (tu
              terapeuta) o marcado para sesión (destacado en consulta).
            </li>
            <li>
              <strong>Lo privado es inviolable.</strong> Ni tu terapeuta, ni
              nuestros sistemas de IA, ni nuestro equipo técnico accedemos a la
              información marcada como privada.
            </li>
            <li>
              <strong>Sin terceros.</strong> Nunca vendemos ni compartimos tus
              datos con terceros para fines publicitarios o de mercadeo.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">Uso de inteligencia artificial</h2>
          <p>
            Usamos Claude (Anthropic) para generar resúmenes operativos
            pre-sesión para los terapeutas. La IA solo accede a información que
            el paciente compartió explícitamente. Los datos enviados a Anthropic
            no se usan para entrenar sus modelos (acuerdo enterprise).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">Almacenamiento y seguridad</h2>
          <p>
            Tus datos viven en infraestructura de Supabase (PostgreSQL cifrado
            en reposo, conexiones TLS, backups automáticos diarios). Las
            contraseñas usan bcrypt y no son accesibles ni siquiera para
            nosotros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">Tus derechos ARCO</h2>
          <p>
            Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al uso de
            tus datos personales. Escribe a <strong>privacidad@noema.app</strong>{' '}
            indicando tu correo de la cuenta y tu solicitud. Responderemos en
            menos de 20 días hábiles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl mt-8">Borrado de cuenta</h2>
          <p>
            Puedes pedir el borrado completo de tu cuenta y todos tus datos
            desde la app, sección Ajustes. La acción es irreversible y se
            ejecuta en 7 días (período de gracia para que puedas
            arrepentirte).
          </p>
        </section>

        <section className="space-y-3 pt-8 border-t border-noema-deep/[0.06]">
          <h2 className="font-serif text-2xl">Contacto</h2>
          <p>
            Para dudas o solicitudes de privacidad:{' '}
            <strong>privacidad@noema.app</strong>
          </p>
        </section>
      </div>
    </article>
  );
}
