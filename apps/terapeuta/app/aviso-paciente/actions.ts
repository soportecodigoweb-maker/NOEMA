'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  VERSION_AVISO_PACIENTE,
  RESUMEN_ACEPTACION_PACIENTE,
} from '@/lib/aviso-privacidad-paciente';

export async function aceptarAvisoPacienteAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? null;

  await supabase.from('consentimientos').insert({
    profile_id: user.id,
    tipo: 'aviso_privacidad',
    version: VERSION_AVISO_PACIENTE,
    aceptado: true,
    texto_resumen: RESUMEN_ACEPTACION_PACIENTE,
    ip,
    user_agent: hdrs.get('user-agent') ?? null,
  });

  revalidatePath('/', 'layout');
  redirect('/paciente');
}
