import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Megaphone, MessageCircle, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AcuerdosPorFirmar } from '@/components/centro/AcuerdosPorFirmar';
import { ObservacionesSupervision } from '@/components/ajustes/ObservacionesSupervision';
import { observacionesDelCentro } from '../ajustes/supervision-data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi centro' };

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });
}

export default async function MiCentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: ct } = await supabase
    .from('centro_terapeutas')
    .select('centro_id, estado')
    .eq('terapeuta_id', user.id)
    .in('estado', ['activa', 'por_confirmar'])
    .maybeSingle();

  if (!ct) {
    return (
      <div className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
            <Building2 className="size-7 text-noema-sage" /> Mi centro
          </h1>
          <p className="mt-4 rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-8 text-center text-sm text-foreground-muted">
            No perteneces a ningún centro terapéutico. Si trabajas en uno, vincúlate desde{' '}
            <span className="font-medium text-ink">Ajustes → Centro terapéutico</span>.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: centro }, { count: mensajesSinLeer }, { data: anuncios }, { data: acuerdos }, observaciones] = await Promise.all([
    supabase.from('centros').select('nombre_centro').eq('profile_id', ct.centro_id).maybeSingle(),
    supabase
      .from('centro_mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('terapeuta_id', user.id)
      .eq('de_centro', true)
      .is('leido_at', null),
    supabase
      .from('centro_anuncios')
      .select('id, titulo, cuerpo, creado_at')
      .eq('centro_id', ct.centro_id)
      .order('creado_at', { ascending: false })
      .limit(10),
    supabase
      .from('centro_acuerdos')
      .select('id, titulo, contenido, enviado_at, firmado_at, firma_nombre')
      .eq('terapeuta_id', user.id)
      .order('enviado_at', { ascending: false })
      .limit(20),
    observacionesDelCentro(user.id),
  ]);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
            <Building2 className="size-7 text-noema-sage" /> {centro?.nombre_centro ?? 'Mi centro'}
          </h1>
          <p className="text-sm text-foreground-muted">
            Anuncios del equipo y tu conversación con la administración.
          </p>
        </div>

        {/* Observaciones de supervisión */}
        <ObservacionesSupervision items={observaciones} />

        {/* Documentos y formatos para firmar */}
        <AcuerdosPorFirmar
          acuerdos={(acuerdos ?? []).map((a) => ({
            id: a.id,
            titulo: a.titulo,
            contenido: a.contenido,
            enviado: fmt(a.enviado_at),
            firmado: a.firmado_at ? fmt(a.firmado_at) : null,
            firmaNombre: a.firma_nombre,
          }))}
        />

        {/* Anuncios del centro */}
        {anuncios && anuncios.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-muted">
              <Megaphone className="size-3.5" /> Anuncios del centro
            </h2>
            <ul className="space-y-2">
              {anuncios.map((a) => (
                <li key={a.id} className="rounded-2xl border border-noema-deep/10 bg-white p-4">
                  <p className="font-medium text-ink">{a.titulo}</p>
                  <p className="text-xs text-foreground-muted">{fmt(a.creado_at)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink/85">{a.cuerpo}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Chat: se abre en su ventana dedicada (como el de pacientes) */}
        <Link
          href="/mensajes/centro"
          className="flex items-center gap-3 rounded-2xl border border-noema-deep/10 bg-white p-4 transition-colors hover:border-noema-sage/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-noema-sage/15 text-noema-deep/70">
            <MessageCircle className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-ink">Chat con la administración</span>
            <span className="block text-xs text-foreground-muted">
              Abre la conversación con tu centro
            </span>
          </span>
          {mensajesSinLeer && mensajesSinLeer > 0 ? (
            <span className="shrink-0 rounded-full bg-noema-clay px-2 py-0.5 text-xs font-medium text-white">
              {mensajesSinLeer}
            </span>
          ) : null}
          <ChevronRight className="size-5 shrink-0 text-foreground-muted" />
        </Link>
      </div>
    </div>
  );
}
