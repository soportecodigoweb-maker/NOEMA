import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CrearRegistro } from '@/components/paciente/CrearRegistro';
import { IconoEmocion } from '@/components/paciente/IconoEmocion';
import { exigirFuncionPaciente } from '@/lib/funciones-paciente';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis registros' };

const PRIVACIDAD_LABEL: Record<string, string> = {
  privado: 'Privado',
  compartido: 'Compartido',
  marcado_sesion: 'Para sesión',
};

export default async function RegistrosPage() {
  await exigirFuncionPaciente('registros_habilitados');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [{ data: emociones }, { data: registros }] = await Promise.all([
    supabase.from('emociones_catalogo').select('key, nombre_es, familia').eq('activa', true).order('orden'),
    supabase
      .from('registros_emocionales')
      .select('id, fecha, hora, emocion_principal_key, emociones_secundarias, intensidad, descripcion, situacion_detonante, privacidad')
      .eq('paciente_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(60),
  ]);

  const nombrePorKey = new Map((emociones ?? []).map((e) => [e.key, e]));

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-5">
        <h1 className="font-serif text-3xl text-ink">Mis registros</h1>
        <p className="mt-1 text-sm text-ink/60">
          Anota cómo te sientes. Tú decides qué compartes con tu terapeuta.
        </p>
      </div>

      {/* Botón largo estilo NOEMA, debajo del texto */}
      <div data-tour="pac-registrar">
        <CrearRegistro emociones={emociones ?? []} />
      </div>

      {!registros || registros.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          Aún no tienes registros. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {registros.map((r) => {
            const emo = nombrePorKey.get(r.emocion_principal_key);
            return (
              <li key={r.id} className="rounded-xl border border-ink/10 bg-white p-4">
                <div className="flex items-start gap-3">
                  <IconoEmocion emocionKey={r.emocion_principal_key} familia={emo?.familia} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-ink">
                        {emo?.nombre_es ?? (r.emocion_principal_key === 'otro' ? 'Otro' : r.emocion_principal_key)}
                      </span>
                      {/* Emociones adicionales del mismo registro */}
                      {(r.emociones_secundarias ?? [])
                        .filter((k: string) => k && k !== r.emocion_principal_key)
                        .map((k: string) => (
                          <span
                            key={k}
                            className="rounded-full bg-noema-sage/12 px-2 py-0.5 text-[11px] text-noema-deep"
                          >
                            {nombrePorKey.get(k)?.nombre_es ?? (k === 'otro' ? 'Otro' : k)}
                          </span>
                        ))}
                      <span className="text-xs text-ink/50">intensidad {r.intensidad}/5</span>
                      <span className="ml-auto rounded bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50">
                        {PRIVACIDAD_LABEL[r.privacidad] ?? r.privacidad}
                      </span>
                    </div>
                    {r.situacion_detonante && (
                      <p className="mt-1 text-xs text-ink/50">Detonante: {r.situacion_detonante}</p>
                    )}
                    {r.descripcion && <p className="mt-1 text-sm text-ink/75">{r.descripcion}</p>}
                    <p className="mt-1 text-[11px] text-ink/40">
                      {new Date(r.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
