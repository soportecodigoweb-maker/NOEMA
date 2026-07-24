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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Diario</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
            <Lock className="size-3" /> Lo privado es inviolable: solo tú lo ves.
          </p>
        </div>
        <CrearDiario />
      </div>

      {!entradas || entradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
          Tu diario está vacío. Escribe tu primera entrada.
        </div>
      ) : (
        <ul className="space-y-3">
          {entradas.map((e) => (
            <li key={e.id} className="rounded-2xl border border-ink/10 bg-white p-5">
              <div className="mb-1 flex items-center gap-2">
                {e.titulo && <h3 className="font-serif text-lg text-ink">{e.titulo}</h3>}
                <span className="ml-auto rounded bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50">
                  {PRIVACIDAD_LABEL[e.privacidad] ?? e.privacidad}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink/80">{e.contenido}</p>
              <p className="mt-2 text-[11px] text-ink/40">
                {new Date(e.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
