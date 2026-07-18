import { redirect } from 'next/navigation';
import { Phone, MessageCircle, LifeBuoy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const LINEAS_MX = [
  {
    nombre: 'SAPTEL — Línea nacional de crisis 24/7',
    telefono: '55 5259 8121',
    descripcion: 'Atención emocional gratuita, confidencial y anónima.',
  },
  {
    nombre: 'Locatel — Línea de la vida CDMX',
    telefono: '55 5658 1111',
    descripcion: 'Apoyo psicológico gratuito 24 horas.',
  },
  {
    nombre: 'Cruz Roja Mexicana',
    telefono: '911',
    descripcion: 'Emergencias médicas y psicológicas.',
  },
];

export default async function PacienteCrisisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  const { data: contactos } = await supabase
    .from('contactos_confianza')
    .select('id, nombre, relacion, telefono')
    .eq('paciente_id', user.id)
    .is('eliminado_at', null)
    .order('creado_at', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-noema-clay/20">
          <LifeBuoy className="size-7 text-noema-clay" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-ink">Necesito apoyo</h1>
          <p className="mt-1 text-sm text-ink/60">
            No estás sola. Estas líneas y personas están disponibles ahora.
          </p>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
          Líneas de emergencia — México
        </h2>
        <div className="space-y-3">
          {LINEAS_MX.map((linea) => (
            <a
              key={linea.telefono}
              href={`tel:${linea.telefono.replace(/\s/g, '')}`}
              className="flex items-start gap-4 rounded-2xl border-[0.5px] border-ink/10 bg-white p-5 transition-colors hover:border-noema-clay/40"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-clay/15">
                <Phone className="size-5 text-noema-clay" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base text-ink">{linea.nombre}</h3>
                <p className="mt-0.5 font-mono text-lg font-medium text-noema-clay">
                  {linea.telefono}
                </p>
                <p className="mt-1 text-xs text-ink/60">{linea.descripcion}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {contactos && contactos.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
            Tus contactos de confianza
          </h2>
          <div className="space-y-3">
            {contactos.map((c) => (
              <a
                key={c.id}
                href={`tel:${c.telefono.replace(/\s/g, '')}`}
                className="flex items-start gap-4 rounded-2xl border-[0.5px] border-ink/10 bg-white p-5 transition-colors hover:border-noema-sage/40"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
                  <Phone className="size-5 text-noema-sage" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base text-ink">{c.nombre}</h3>
                  <p className="mt-0.5 text-xs text-ink/60">{c.relacion}</p>
                  <p className="mt-1 font-mono text-base text-ink/80">{c.telefono}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-noema-sage/10 p-6">
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 size-5 shrink-0 text-noema-sage" strokeWidth={1.6} />
          <div>
            <h3 className="font-serif text-base text-ink">
              Si prefieres escribir a tu terapeuta
            </h3>
            <p className="mt-1 text-sm text-ink/70">
              Recuerda que la comunicación con tu terapeuta es asíncrona — puede
              tardar en responder. Si el momento es urgente, usa una de las líneas de arriba.
            </p>
            <a
              href="/paciente/mensajes"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone transition-colors hover:bg-noema-deep/90"
            >
              Abrir mensajes
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
