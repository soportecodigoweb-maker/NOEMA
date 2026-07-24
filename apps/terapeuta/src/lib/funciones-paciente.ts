import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type FuncionPaciente =
  | 'sos_habilitado'
  | 'chat_habilitado'
  | 'diario_habilitado'
  | 'registros_habilitados'
  | 'tareas_habilitadas'
  | 'progreso_habilitado'
  | 'mensajes_ia_habilitados'
  | 'agenda_habilitada';

/**
 * Verifica que el terapeuta tenga habilitada esa función para el paciente.
 *
 * Ocultar el enlace del menú NO es suficiente: alguien podría entrar
 * escribiendo la URL. Esto se llama en la página misma y redirige al inicio si
 * la función está apagada.
 *
 * Si el paciente aún no tiene terapeuta vinculado, no se bloquea nada
 * (esas funciones son suyas y no dependen de un terapeuta).
 */
export async function exigirFuncionPaciente(funcion: FuncionPaciente): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select(funcion)
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  if (!vinc) return; // sin terapeuta: no hay nada que restringir

  const habilitada = (vinc as unknown as Record<string, boolean | null>)[funcion];
  if (habilitada === false) redirect('/paciente');
}
