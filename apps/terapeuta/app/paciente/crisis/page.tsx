import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Phone, MessageCircle, Video, LifeBuoy, HeartHandshake } from 'lucide-react';
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
    nombre: 'Emergencias',
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

  // Vinculación activa con datos de contacto de crisis del terapeuta
  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, terapeuta_id, telefono_terapeuta, video_crisis_url')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  let terapeutaNombre: string | null = null;
  if (vinc) {
    const { data: t } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', vinc.terapeuta_id)
      .maybeSingle();
    terapeutaNombre = t?.nombre ?? null;
  }

  const { data: contactos } = await supabase
    .from('contactos_confianza')
    .select('id, nombre, relacion, telefono')
    .eq('paciente_id', user.id)
    .is('eliminado_at', null)
    .order('creado_at', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-noema-clay/20">
          <LifeBuoy className="size-7 text-noema-clay" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-ink">Necesito apoyo</h1>
          <p className="mt-1 text-sm text-ink/60">
            No estás sola. Elige cómo quieres pedir ayuda ahora.
          </p>
        </div>
      </header>

      {/* Contacto con el terapeuta (#10) */}
      {vinc && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
            Contactar a {terapeutaNombre ?? 'mi terapeuta'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/paciente/mensajes"
              className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-center transition-colors hover:border-noema-sage"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
                <MessageCircle className="size-5 text-noema-sage" strokeWidth={1.7} />
              </div>
              <span className="font-medium text-ink">Mensaje</span>
              <span className="text-xs text-ink/50">Escríbele ahora</span>
            </Link>

            {vinc.telefono_terapeuta ? (
              <a
                href={`tel:${vinc.telefono_terapeuta.replace(/\s/g, '')}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-center transition-colors hover:border-noema-clay"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-noema-clay/15">
                  <Phone className="size-5 text-noema-clay" strokeWidth={1.7} />
                </div>
                <span className="font-medium text-ink">Llamar</span>
                <span className="text-xs text-ink/50">{vinc.telefono_terapeuta}</span>
              </a>
            ) : (
              <OpcionDeshabilitada icon={<Phone className="size-5" strokeWidth={1.7} />} label="Llamar" nota="No configurado" />
            )}

            {vinc.video_crisis_url ? (
              <a
                href={vinc.video_crisis_url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-center transition-colors hover:border-noema-sage"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
                  <Video className="size-5 text-noema-sage" strokeWidth={1.7} />
                </div>
                <span className="font-medium text-ink">Videollamada</span>
                <span className="text-xs text-ink/50">Entrar ahora</span>
              </a>
            ) : (
              <OpcionDeshabilitada icon={<Video className="size-5" strokeWidth={1.7} />} label="Videollamada" nota="No configurado" />
            )}
          </div>
          <p className="mt-3 text-xs text-ink/50">
            Recuerda: la comunicación con tu terapeuta puede no ser inmediata. Si
            es una emergencia, usa las líneas de abajo.
          </p>
        </section>
      )}

      {/* Líneas de emergencia */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
          Líneas de emergencia — México (24/7)
        </h2>
        <div className="space-y-3">
          {LINEAS_MX.map((linea) => (
            <a
              key={linea.telefono}
              href={`tel:${linea.telefono.replace(/\s/g, '')}`}
              className="flex items-start gap-4 rounded-2xl border border-ink/10 bg-white p-5 transition-colors hover:border-noema-clay/40"
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

      {/* Contactos de confianza */}
      {contactos && contactos.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
            Tus contactos de confianza
          </h2>
          <div className="space-y-3">
            {contactos.map((c) => (
              <a
                key={c.id}
                href={`tel:${c.telefono.replace(/\s/g, '')}`}
                className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-5 transition-colors hover:border-noema-sage/40"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
                  <HeartHandshake className="size-5 text-noema-sage" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base text-ink">{c.nombre}</h3>
                  <p className="text-xs text-ink/60">{c.relacion}</p>
                </div>
                <span className="font-mono text-sm text-ink/70">{c.telefono}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OpcionDeshabilitada({
  icon,
  label,
  nota,
}: {
  icon: React.ReactNode;
  label: string;
  nota: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink/10 bg-ink/[0.02] p-5 text-center opacity-60">
      <div className="flex size-11 items-center justify-center rounded-full bg-ink/5 text-ink/40">
        {icon}
      </div>
      <span className="font-medium text-ink/50">{label}</span>
      <span className="text-xs text-ink/40">{nota}</span>
    </div>
  );
}
