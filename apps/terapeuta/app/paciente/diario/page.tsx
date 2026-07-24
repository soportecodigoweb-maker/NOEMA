import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CrearDiario } from '@/components/paciente/CrearDiario';
import { exigirFuncionPaciente } from '@/lib/funciones-paciente';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Diario' };

const PRIVACIDAD_LABEL: Record<string, string> = {
  privado: 'Privado',
  compartido: 'Compartido',
  marcado_sesion: 'Para sesión',
};

export default async function DiarioPage() {
  await exigirFuncionPaciente('diario_habilitado');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: entradas } = await supabase
    .from('diario_entradas')
    .select('id, fecha, titulo, contenido, privacidad')
    .eq('paciente_id', user.id)
    .order('fecha', { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-5">
        <h1 className="font-serif text-3xl text-ink">Diario</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
          <Lock className="size-3" /> Lo privado es inviolable: solo tú lo ves.
        </p>
      </div>

      <CrearDiario />

      {!entradas || entradas.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          Tu diario está vacío. Abre una hoja y escribe tu primera entrada.
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {entradas.map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border border-noema-deep/10 bg-[#FBF7EE] p-5 shadow-[0_1px_0_rgba(46,59,46,0.04),0_10px_24px_-18px_rgba(46,59,46,0.4)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] text-ink/45">
                  {new Date(e.fecha).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'America/Mexico_City',
                  })}
                </span>
                <span className="ml-auto rounded bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50">
                  {PRIVACIDAD_LABEL[e.privacidad] ?? e.privacidad}
                </span>
              </div>
              {e.titulo && (
                <h3 className="[font-family:var(--font-manuscrita)] text-2xl text-ink">{e.titulo}</h3>
              )}
              <p className="[font-family:var(--font-manuscrita)] mt-1 line-clamp-6 whitespace-pre-wrap text-xl leading-7 text-ink/80">
                {e.contenido}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
