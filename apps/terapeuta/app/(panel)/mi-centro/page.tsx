import { redirect } from 'next/navigation';
import { Building2, Megaphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ChatConCentro } from '@/components/centro/ChatConCentro';
import { RefrescarEnVivo } from '@/components/util/RefrescarEnVivo';

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

  const [{ data: centro }, { data: mensajes }, { data: anuncios }] = await Promise.all([
    supabase.from('centros').select('nombre_centro').eq('profile_id', ct.centro_id).maybeSingle(),
    supabase
      .from('centro_mensajes')
      .select('id, cuerpo, de_centro, creado_at')
      .eq('terapeuta_id', user.id)
      .order('creado_at', { ascending: true })
      .limit(200),
    supabase
      .from('centro_anuncios')
      .select('id, titulo, cuerpo, creado_at')
      .eq('centro_id', ct.centro_id)
      .order('creado_at', { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Tiempo real: si el centro escribe, aparece al instante */}
        <RefrescarEnVivo
          tabla="centro_mensajes"
          filtro={`terapeuta_id=eq.${user.id}`}
          canal={`centro-chat-${user.id}`}
        />

        <div>
          <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
            <Building2 className="size-7 text-noema-sage" /> {centro?.nombre_centro ?? 'Mi centro'}
          </h1>
          <p className="text-sm text-foreground-muted">
            Anuncios del equipo y tu conversación con la administración.
          </p>
        </div>

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

        {/* Chat 1 a 1 */}
        <ChatConCentro
          centroNombre={centro?.nombre_centro ?? 'Tu centro'}
          mensajes={(mensajes ?? []).map((m) => ({
            id: m.id,
            cuerpo: m.cuerpo,
            deCentro: m.de_centro,
            fecha: fmt(m.creado_at),
          }))}
        />
      </div>
    </div>
  );
}
