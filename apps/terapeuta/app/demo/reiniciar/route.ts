/** Reiniciar demo: borra la historia del visitante y la vuelve a sembrar. */
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_DEMO } from '@/lib/demo/constantes';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const visitante = req.cookies.get(COOKIE_DEMO)?.value;
  if (!visitante) return NextResponse.json({ ok: false, error: 'sin_demo' }, { status: 400 });
  const db = createServiceClient();
  const { data, error } = await db.rpc('demo_reiniciar', { p_visitante: visitante });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { ok: false });
}
