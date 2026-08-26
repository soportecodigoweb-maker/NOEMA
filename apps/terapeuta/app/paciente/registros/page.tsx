import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CrearRegistro } from '@/components/paciente/CrearRegistro';
import { ListaRegistros } from '@/components/paciente/ListaRegistros';
import { exigirFuncionPaciente } from '@/lib/funciones-paciente';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mis registros' };

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

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="mb-5">
        <h1 className="font-serif text-3xl text-ink">Mis registros</h1>
        <p className="mt-1 text-sm text-ink/60">
          Anota cómo te sientes. Tú decides qué compartes con tu terapeuta — y puedes cambiarlo
          después, uno por uno o varios a la vez.
        </p>
      </div>

      {/* Botón largo estilo NOEMA, debajo del texto */}
      <div data-tour="pac-registrar">
        <CrearRegistro emociones={emociones ?? []} />
      </div>

      <ListaRegistros registros={registros ?? []} emociones={emociones ?? []} />
    </div>
  );
}
