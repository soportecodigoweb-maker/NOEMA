import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CrearRegistro } from '@/components/paciente/CrearRegistro';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis registros' };

const FAMILIA_COLOR: Record<string, string> = {
  tranquilo: 'bg-emerald-500',
  feliz: 'bg-sky-400',
  ansioso: 'bg-amber-400',
  triste: 'bg-rose-400',
  cansado: 'bg-orange-300',
};

const PRIVACIDAD_LABEL: Record<string, string> = {
  privado: 'Privado',
  compartido: 'Compartido',
  marcado_sesion: 'Para sesión',
};

export default async function RegistrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [{ data: emociones }, { data: registros }] = await Promise.all([
    supabase.from('emociones_catalogo').select('key, nombre_es, familia').eq('activa', true).order('orden'),
    supabase
      .from('registros_emocionales')
      .select('id, fecha, hora, emocion_principal_key, intensidad, descripcion, situacion_detonante, privacidad')
      .eq('paciente_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(60),
  ]);

  const nombrePorKey = new Map((emociones ?? []).map((e) => [e.key, e]));

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Mis registros</h1>
          <p className="mt-1 text-sm text-ink/60">
            Anota cómo te sientes. Tú decides qué compartes con tu terapeuta.
          </p>
        </div>
        <CrearRegistro emociones={emociones ?? []} />
      </div>

      {!registros || registros.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          Aún no tienes registros. Crea el primero con “Nuevo registro”.
        </div>
      ) : (
        <ul className="space-y-2">
          {registros.map((r) => {
            const emo = nombrePorKey.get(r.emocion_principal_key);
            return (
              <li key={r.id} className="rounded-xl border border-ink/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${FAMILIA_COLOR[emo?.familia ?? ''] ?? 'bg-ink/30'}`} />
                  <span className="font-medium text-ink">{emo?.nombre_es ?? r.emocion_principal_key}</span>
                  <span className="text-xs text-ink/50">· intensidad {r.intensidad}/5</span>
                  <span className="ml-auto rounded bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50">
                    {PRIVACIDAD_LABEL[r.privacidad] ?? r.privacidad}
                  </span>
                </div>
                {r.situacion_detonante && (
                  <p className="mt-1 text-xs text-ink/50">Detonante: {r.situacion_detonante}</p>
                )}
                {r.descripcion && <p className="mt-1 text-sm text-ink/75">{r.descripcion}</p>}
                <p className="mt-1 text-[11px] text-ink/40">
                  {new Date(r.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
