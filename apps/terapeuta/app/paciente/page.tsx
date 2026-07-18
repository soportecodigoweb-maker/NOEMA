import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, MessageCircle, Smartphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PacienteInicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  // Vinculación activa
  const { data: vinculacion } = await supabase
    .from('vinculaciones')
    .select(`
      id,
      terapeuta:profiles!vinculaciones_terapeuta_id_fkey(nombre)
    `)
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  // Próxima sesión programada
  let proximaSesion: { fecha_programada: string; modalidad: string | null } | null = null;
  let mensajesSinLeer = 0;

  if (vinculacion) {
    const { data: sesion } = await supabase
      .from('sesiones')
      .select('fecha_programada, modalidad')
      .eq('vinculacion_id', vinculacion.id)
      .eq('estado', 'programada')
      .gte('fecha_programada', new Date().toISOString())
      .order('fecha_programada', { ascending: true })
      .limit(1)
      .maybeSingle();
    proximaSesion = sesion;

    // Mensajes del terapeuta sin leer
    const { count } = await supabase
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('vinculacion_id', vinculacion.id)
      .neq('autor_id', user.id)
      .is('leido_at', null);
    mensajesSinLeer = count ?? 0;
  }

  const terapeutaRaw = vinculacion?.terapeuta as
    | { nombre?: string }
    | { nombre?: string }[]
    | null
    | undefined;
  const terapeutaNombre = Array.isArray(terapeutaRaw)
    ? terapeutaRaw[0]?.nombre ?? null
    : terapeutaRaw?.nombre ?? null;

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <header className="mb-10">
        <p className="text-sm text-noema-sage/70">Hola,</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          Tu proceso continúa acompañado.
        </h1>
      </header>

      {!vinculacion ? (
        <SinTerapeutaCard />
      ) : (
        <div className="space-y-4">
          <ProximaSesionCard sesion={proximaSesion} terapeuta={terapeutaNombre} />
          <MensajesCard sinLeer={mensajesSinLeer} />
          <MobileAppCard />
        </div>
      )}
    </div>
  );
}

function ProximaSesionCard({
  sesion,
  terapeuta,
}: {
  sesion: { fecha_programada: string; modalidad: string | null } | null;
  terapeuta: string | null;
}) {
  if (!sesion) {
    return (
      <Link
        href="/paciente/sesiones"
        className="block rounded-2xl border-[0.5px] border-ink/10 bg-white p-6 transition-colors hover:border-ink/20"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/10">
            <Calendar className="size-5 text-noema-sage" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-lg text-ink">Sin sesiones agendadas</h2>
            <p className="mt-1 text-sm text-ink/60">
              Cuando {terapeuta ?? 'tu terapeuta'} agende una sesión, aparecerá aquí.
            </p>
          </div>
        </div>
      </Link>
    );
  }

  const fecha = new Date(sesion.fecha_programada);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();

  return (
    <Link
      href="/paciente/sesiones"
      className={`block rounded-2xl p-6 transition-colors ${
        esHoy
          ? 'bg-noema-deep text-bone hover:bg-noema-deep/95'
          : 'border-[0.5px] border-ink/10 bg-white hover:border-ink/20'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
            esHoy ? 'bg-bone/15' : 'bg-noema-sage/10'
          }`}
        >
          <Calendar
            className={`size-5 ${esHoy ? 'text-bone' : 'text-noema-sage'}`}
            strokeWidth={1.6}
          />
        </div>
        <div className="min-w-0">
          <p className={`text-xs uppercase tracking-wider ${esHoy ? 'text-bone/60' : 'text-ink/50'}`}>
            {esHoy ? 'Sesión de hoy' : 'Próxima sesión'}
          </p>
          <h2 className={`mt-1 font-serif text-lg ${esHoy ? 'text-bone' : 'text-ink'}`}>
            {fecha.toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h2>
          <p className={`mt-1 text-sm ${esHoy ? 'text-bone/80' : 'text-ink/60'}`}>
            {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} ·{' '}
            {sesion.modalidad === 'online' ? 'Videollamada' : 'Presencial'}
            {terapeuta && ` · con ${terapeuta}`}
          </p>
        </div>
      </div>
    </Link>
  );
}

function MensajesCard({ sinLeer }: { sinLeer: number }) {
  return (
    <Link
      href="/paciente/mensajes"
      className="block rounded-2xl border-[0.5px] border-ink/10 bg-white p-6 transition-colors hover:border-ink/20"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/10">
          <MessageCircle className="size-5 text-noema-sage" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg text-ink">Mensajes</h2>
            {sinLeer > 0 && (
              <span className="rounded-full bg-noema-clay/20 px-2 py-0.5 text-xs font-medium text-noema-clay">
                {sinLeer} sin leer
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink/60">
            {sinLeer > 0
              ? `Tienes ${sinLeer} mensaje${sinLeer > 1 ? 's' : ''} nuevo${sinLeer > 1 ? 's' : ''} de tu terapeuta.`
              : 'Comunicación asíncrona con tu terapeuta.'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function MobileAppCard() {
  return (
    <div className="rounded-2xl border-[0.5px] border-dashed border-noema-sage/30 bg-noema-sage/5 p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
          <Smartphone className="size-5 text-noema-sage" strokeWidth={1.6} />
        </div>
        <div>
          <h3 className="font-serif text-base text-ink">
            La app móvil es tu compañera diaria
          </h3>
          <p className="mt-1 text-sm text-ink/60">
            Registros emocionales, diario, ejercicios, notificaciones. Todo lo que
            capturas ahí llega automáticamente al panel de tu terapeuta.
          </p>
        </div>
      </div>
    </div>
  );
}

function SinTerapeutaCard() {
  return (
    <div className="rounded-2xl border-[0.5px] border-ink/10 bg-white p-8">
      <h2 className="font-serif text-xl text-ink">Aún no estás vinculada con un terapeuta</h2>
      <p className="mt-3 text-sm text-ink/70">
        Cuando tu terapeuta te envíe un código de invitación, podrás usarlo desde
        la app móvil para conectar tu cuenta con la de tu terapeuta.
      </p>
      <Link
        href="/terapeutas"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone transition-colors hover:bg-noema-deep/90"
      >
        Explorar el directorio de terapeutas
      </Link>
    </div>
  );
}
