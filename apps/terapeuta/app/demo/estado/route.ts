/** Estado del visitante demo (ids que necesita el recorrido guiado). */
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_DEMO } from '@/lib/demo/constantes';
import { estadoDemo } from '@/lib/demo/servidor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const visitante = req.cookies.get(COOKIE_DEMO)?.value;
  if (!visitante) return NextResponse.json({ ok: false, error: 'sin_demo' }, { status: 404 });
  const e = await estadoDemo(visitante);
  // No exponemos correos ni ids de usuario al navegador; solo lo que usa el recorrido.
  return NextResponse.json({
    ok: e.ok,
    vinculacionId: e.vinculacion_id ?? null,
    creadoAt: e.creado_at ?? null,
  });
}
