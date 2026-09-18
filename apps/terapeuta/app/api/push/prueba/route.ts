/**
 * "Mándame una de prueba": inserta una notificación tipo 'mensaje' al usuario
 * con sesión. El trigger de la BD la despacha al instante, así que prueba la
 * cadena completa (BD → pg_net → /api/push/despachar → navegador).
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  // Quién es: SIEMPRE con el cliente de sesión (anon + cookies), nunca service_role.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  // La tabla la llenan triggers (los clientes no tienen INSERT): usamos service_role.
  const db = createServiceClient();
  const { data, error } = await db
    .from('notificaciones')
    .insert({
      destinatario_id: user.id,
      tipo: 'mensaje',
      titulo: 'Prueba de avisos',
      cuerpo: 'Si ves esto, los avisos push funcionan en este dispositivo.',
      url: '/',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
