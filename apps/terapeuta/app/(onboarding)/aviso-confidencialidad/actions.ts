'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  VERSION_AVISO,
  RESUMEN_ACEPTACION_TERAPEUTA,
} from '@/lib/aviso-confidencialidad';

export async function aceptarAvisoAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  const hdrs = await headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    null;
  const userAgent = hdrs.get('user-agent') ?? null;

  await supabase.from('consentimientos').insert({
    profile_id: user.id,
    tipo: 'aviso_privacidad',
    version: VERSION_AVISO,
    aceptado: true,
    texto_resumen: RESUMEN_ACEPTACION_TERAPEUTA,
    ip,
    user_agent: userAgent,
  });

  revalidatePath('/', 'layout');
  redirect('/inicio');
}
