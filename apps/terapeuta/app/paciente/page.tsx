import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Calendar,
  MessageCircle,
  Smartphone,
  HeartPulse,
  BookOpen,
  BarChart3,
  Target,
  ClipboardList,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { VincularTerapeuta } from '@/components/paciente/VincularTerapeuta';
import { MensajeNoema } from '@/components/paciente/MensajeNoema';

export const dynamic = 'force-dynamic';

export default async function PacienteInicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  // Perfil (para el saludo) y vinculación activa con sus funciones habilitadas.
  const [{ data: perfil }, { data: vinculacion }] = await Promise.all([
    supabase.from('profiles').select('nombre').eq('id', user.id).maybeSingle(),
    supabase
      .from('vinculaciones')
      .select(
        'id, terapeuta_id, chat_habilitado, diario_habilitado, registros_habilitados, tareas_habilitadas, progreso_habilitado',
      )
      .eq('paciente_id', user.id)
      .eq('estado', 'activa')
      .maybeSingle(),
  ]);

  const primerNombre = (perfil?.nombre ?? '').trim().split(' ')[0] ?? '';

  // Funciones (sin terapeuta, las propias del paciente van habilitadas).
  const f = {
    registros: vinculacion?.registros_habilitados ?? true,
    diario: vinculacion?.diario_habilitado ?? true,
    tareas: vinculacion?.tareas_habilitadas ?? true,
    progreso: vinculacion?.progreso_habilitado ?? true,
    chat: vinculacion?.chat_habilitado ?? true,
  };

  // Nombre del terapeuta, próxima sesión y mensajes sin leer (solo si vinculado).
  let terapeutaNombre: string | null = null;
  let proximaSesion: { fecha_programada: string; modalidad: string | null } | null = null;
  let mensajesSinLeer = 0;

  if (vinculacion) {
    const { data: terap } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', vinculacion.terapeuta_id)
      .maybeSingle();
    terapeutaNombre = terap?.nombre ?? null;

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

    const { count } = await supabase
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('vinculacion_id', vinculacion.id)
      .neq('autor_id', user.id)
      .is('leido_at', null);
    mensajesSinLeer = count ?? 0;
  }

  // Accesos rápidos (respetan lo que el terapeuta habilitó).
  const accesos: { href: string; label: string; icon: LucideIcon }[] = [
    f.diario && { href: '/paciente/diario', label: 'Diario', icon: BookOpen },
    { href: '/paciente/metas', label: 'Mis metas', icon: Target },
    f.progreso && { href: '/paciente/progreso', label: 'Progreso', icon: BarChart3 },
    vinculacion && f.tareas && { href: '/paciente/tareas', label: 'Tareas', icon: ClipboardList },
    vinculacion && f.chat && { href: '/paciente/mensajes', label: 'Mensajes', icon: MessageCircle },
  ].filter(Boolean) as { href: string; label: string; icon: LucideIcon }[];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="mb-6">
        <p className="text-sm text-noema-sage/70">Hola{primerNombre ? `, ${primerNombre}` : ''},</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Tu proceso continúa acompañado.</h1>
        {terapeutaNombre && (
          <p className="mt-1 text-sm text-ink/60">Vinculada con {terapeutaNombre}</p>
        )}
      </header>

      {/* 1 · Atajo a emociones: banner delgado que invita a registrar */}
      {f.registros && <BannerEmocion />}

      {/* 2 · Accesos rápidos */}
      {accesos.length > 0 && (
        <div className="mb-7 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {accesos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex w-[104px] shrink-0 flex-col items-start gap-2.5 rounded-2xl border-[0.5px] border-ink/10 bg-white p-3.5 transition-colors hover:border-noema-sage/40"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-noema-sage/10 text-noema-sage transition-colors group-hover:bg-noema-sage/15">
                <a.icon className="size-[18px]" strokeWidth={1.7} />
              </span>
              <span className="text-xs font-medium text-ink">{a.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* 3 · Resumen */}
      {!vinculacion ? (
        <VincularTerapeuta />
      ) : (
        <section>
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-ink/40">Tu resumen</p>
          <div className="space-y-3.5">
            <MensajeNoema />
            <ProximaSesionCard sesion={proximaSesion} terapeuta={terapeutaNombre} />
            <MensajesCard sinLeer={mensajesSinLeer} />
            <MobileAppCard />
          </div>
        </section>
      )}
    </div>
  );
}

/** Banner delgado y cálido que invita a registrar una emoción. */
function BannerEmocion() {
  const puntos = ['#C7D2BD', '#F0C9AE', '#E8B5AB', '#D9B98C', '#B9C9CC'];
  return (
    <Link
      href="/paciente/registros"
      className="group relative mb-4 flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-noema-deep via-noema-sage to-noema-sage px-5 py-4 text-bone shadow-[0_12px_30px_-14px_rgba(46,59,46,0.6)] transition-transform hover:-translate-y-0.5"
    >
      {/* Brillo decorativo */}
      <span
        className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-bone/10 blur-2xl"
        aria-hidden
      />
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-bone/15">
        <HeartPulse className="size-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg leading-tight">¿Cómo te sientes ahora?</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex gap-1" aria-hidden>
            {puntos.map((c) => (
              <span key={c} className="size-1.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <p className="text-xs text-bone/75">Registra tu emoción · toma 20 segundos</p>
        </div>
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-bone/80 transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </Link>
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
        className="block rounded-2xl border-[0.5px] border-ink/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink/20"
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
      className={`block rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${
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
            {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })} ·{' '}
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
      className="block rounded-2xl border-[0.5px] border-ink/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink/20"
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
    <div className="rounded-2xl border-[0.5px] border-dashed border-noema-sage/30 bg-noema-sage/5 p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15">
          <Smartphone className="size-5 text-noema-sage" strokeWidth={1.6} />
        </div>
        <div>
          <h3 className="font-serif text-base text-ink">La app móvil es tu compañera diaria</h3>
          <p className="mt-1 text-sm text-ink/60">
            Registros emocionales, diario, ejercicios, notificaciones. Todo lo que capturas
            ahí llega automáticamente al panel de tu terapeuta.
          </p>
        </div>
      </div>
    </div>
  );
}
