import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, ChevronRight, Clock, PauseCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { listaTerapeutasCentro } from '../data';
import { InvitarTerapeuta } from '@/components/centro/InvitarTerapeuta';
import { AcuerdoColaboracion } from '@/components/centro/AcuerdoColaboracion';
import { ConfirmarIncorporacion } from '@/components/centro/ConfirmarIncorporacion';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Terapeutas · Centro' };

export default async function TerapeutasCentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [todos, { data: centro }] = await Promise.all([
    listaTerapeutasCentro(user.id, false),
    supabase.from('centros').select('codigo_centro, acuerdo_terapeuta').eq('profile_id', user.id).maybeSingle(),
  ]);

  const activos = todos.filter((t) => t.estado === 'activa');
  const pendientes = todos.filter((t) => t.estado === 'pendiente');
  const suspendidos = todos.filter((t) => t.estado === 'inactiva');
  const porConfirmar = todos.filter((t) => t.estado === 'por_confirmar');

  const Tarjeta = ({
    t,
    nota,
  }: {
    t: { terapeutaId: string; nombre: string; pacientes: number };
    nota?: React.ReactNode;
  }) => (
    <li>
      <Link
        href={`/centro/terapeutas/${t.terapeutaId}`}
        className="flex items-center gap-4 rounded-2xl border border-noema-deep/10 bg-white p-4 transition-colors hover:border-noema-sage/40"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15 text-sm font-medium text-noema-deep/70">
          {t.nombre
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase() ?? '')
            .join('')}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">{t.nombre}</p>
          <p className="text-xs text-foreground-muted">
            {nota ?? `${t.pacientes} paciente${t.pacientes === 1 ? '' : 's'} activo${t.pacientes === 1 ? '' : 's'}`}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-foreground-muted" />
      </Link>
    </li>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Users className="size-7 text-noema-sage" /> Terapeutas
        </h1>
        <p className="text-sm text-foreground-muted">
          Invita, gestiona y reasigna. Toca un terapeuta para ver sus pacientes y su expediente.
        </p>
      </div>

      <InvitarTerapeuta codigo={centro?.codigo_centro ?? null} />

      <AcuerdoColaboracion inicial={centro?.acuerdo_terapeuta ?? ''} />

      {/* Aceptaron el acuerdo: falta que el centro confirme */}
      {porConfirmar.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-noema-sage">
            <Clock className="size-3.5" /> Aceptaron el acuerdo · confirma su incorporación ({porConfirmar.length})
          </h2>
          <ul className="space-y-2">
            {porConfirmar.map((t) => (
              <li
                key={t.terapeutaId}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-noema-sage/30 bg-noema-sage/[0.05] p-4"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/20 text-sm font-medium text-noema-deep/70">
                  {t.nombre.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase() ?? '').join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{t.nombre}</p>
                  <p className="text-xs text-foreground-muted">Aceptó el acuerdo de colaboración</p>
                </div>
                <ConfirmarIncorporacion terapeutaId={t.terapeutaId} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pendientes de aceptar */}
      {pendientes.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-muted">
            <Clock className="size-3.5" /> Invitaciones enviadas ({pendientes.length})
          </h2>
          <ul className="space-y-2">
            {pendientes.map((t) => (
              <Tarjeta key={t.terapeutaId} t={t} nota="Esperando que acepte la invitación" />
            ))}
          </ul>
        </section>
      )}

      {/* Activos */}
      <section>
        <h2 className="mb-2 text-xs uppercase tracking-wider text-foreground-muted">
          Equipo activo ({activos.length})
        </h2>
        {activos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
            Aún no hay terapeutas en tu equipo. Invítalos por correo o comparte el código de tu centro.
          </p>
        ) : (
          <ul className="space-y-2">
            {activos.map((t) => (
              <Tarjeta key={t.terapeutaId} t={t} />
            ))}
          </ul>
        )}
      </section>

      {/* Suspendidos */}
      {suspendidos.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-muted">
            <PauseCircle className="size-3.5" /> Suspendidos ({suspendidos.length})
          </h2>
          <ul className="space-y-2">
            {suspendidos.map((t) => (
              <Tarjeta
                key={t.terapeutaId}
                t={t}
                nota={`Suspendido · ${t.pacientes} paciente(s) por reasignar`}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
