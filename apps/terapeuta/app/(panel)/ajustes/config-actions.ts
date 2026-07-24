'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ConfigTerapeuta {
  // Funciones del paciente (defectos)
  sos_habilitado: boolean;
  chat_habilitado: boolean;
  agenda_habilitada: boolean;
  diario_habilitado: boolean;
  registros_habilitados: boolean;
  tareas_habilitadas: boolean;
  progreso_habilitado: boolean;
  mensajes_ia_habilitados: boolean;
  notif_paciente: boolean;
  // Mis notificaciones
  notif_sonido: string;
  notif_mensajes: boolean;
  notif_registros: boolean;
  notif_crisis: boolean;
  notif_tareas: boolean;
  no_molestar_activo: boolean;
  no_molestar_desde: string;
  no_molestar_hasta: string;
}

/** Campos booleanos que se pueden alternar desde Ajustes. */
const CAMPOS_BOOL = new Set([
  'sos_habilitado',
  'chat_habilitado',
  'agenda_habilitada',
  'diario_habilitado',
  'registros_habilitados',
  'tareas_habilitadas',
  'progreso_habilitado',
  'mensajes_ia_habilitados',
  'notif_paciente',
  'notif_mensajes',
  'notif_registros',
  'notif_crisis',
  'notif_tareas',
  'no_molestar_activo',
]);

const SONIDOS = new Set(['suave', 'campana', 'silencioso']);

/**
 * Guarda un ajuste del terapeuta. Se hace campo por campo para que cada
 * interruptor guarde al instante, sin botón de "guardar".
 */
export async function guardarConfigAction(
  campo: string,
  valor: boolean | string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sin sesión' };

  // Validamos el campo contra una lista blanca (nunca confiar en el cliente).
  let patch: Record<string, boolean | string>;
  if (CAMPOS_BOOL.has(campo) && typeof valor === 'boolean') {
    patch = { [campo]: valor };
  } else if (campo === 'notif_sonido' && typeof valor === 'string' && SONIDOS.has(valor)) {
    patch = { notif_sonido: valor };
  } else if (
    (campo === 'no_molestar_desde' || campo === 'no_molestar_hasta') &&
    typeof valor === 'string' &&
    /^\d{2}:\d{2}$/.test(valor)
  ) {
    patch = { [campo]: valor };
  } else {
    return { ok: false, error: 'Ajuste no válido.' };
  }

  const { error } = await supabase
    .from('configuracion_terapeuta')
    .upsert(
      { terapeuta_id: user.id, ...patch, actualizado_at: new Date().toISOString() },
      { onConflict: 'terapeuta_id' },
    );

  if (error) return { ok: false, error: 'No se pudo guardar.' };

  revalidatePath('/ajustes');
  return { ok: true };
}

/**
 * Aplica los defectos actuales a TODOS los pacientes activos.
 * Útil cuando el terapeuta cambia su criterio y quiere alinear a todos.
 */
export async function aplicarATodosAction(): Promise<{ ok: boolean; total?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: cfg } = await supabase
    .from('configuracion_terapeuta')
    .select(
      'sos_habilitado, chat_habilitado, agenda_habilitada, diario_habilitado, registros_habilitados, tareas_habilitadas, progreso_habilitado, mensajes_ia_habilitados, notif_paciente',
    )
    .eq('terapeuta_id', user.id)
    .maybeSingle();

  if (!cfg) return { ok: false };

  const { data, error } = await supabase
    .from('vinculaciones')
    .update(cfg)
    .eq('terapeuta_id', user.id)
    .eq('estado', 'activa')
    .select('id');

  if (error) return { ok: false };

  revalidatePath('/ajustes');
  return { ok: true, total: data?.length ?? 0 };
}
