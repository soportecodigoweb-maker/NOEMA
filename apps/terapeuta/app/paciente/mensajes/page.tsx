import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MensajesThread } from '@/components/paciente/MensajesThread';

export const dynamic = 'force-dynamic';

export default async function PacienteMensajesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  // El FK vinculaciones.terapeuta_id apunta a terapeutas(profile_id), no a
  // profiles, así que el embed `profiles!vinculaciones_terapeuta_id_fkey` no
  // resuelve en PostgREST (devuelve error → vinculacion null → "sin terapeuta").
  // Como terapeuta_id === profiles.id, resolvemos el perfil en una 2ª consulta.
  const { data: vinculacion } = await supabase
    .from('vinculaciones')
    .select('id, terapeuta_id')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  if (!vinculacion) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="font-serif text-3xl text-ink">Mensajes</h1>
        <p className="mt-4 text-ink/60">
          Aún no tienes un terapeuta vinculado. Cuando lo tengas, podrán
          comunicarse desde aquí.
        </p>
      </div>
    );
  }

  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('id, autor_id, contenido, creado_at, leido_at')
    .eq('vinculacion_id', vinculacion.id)
    .order('creado_at', { ascending: true });

  // Marcar mensajes del terapeuta como leídos
  await supabase
    .from('mensajes')
    .update({ leido_at: new Date().toISOString() })
    .eq('vinculacion_id', vinculacion.id)
    .neq('autor_id', user.id)
    .is('leido_at', null);

  const { data: terapeuta } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', vinculacion.terapeuta_id)
    .maybeSingle();

  return (
    <MensajesThread
      vinculacionId={vinculacion.id}
      userId={user.id}
      terapeutaNombre={terapeuta?.nombre ?? 'Tu terapeuta'}
      mensajesIniciales={mensajes ?? []}
    />
  );
}
