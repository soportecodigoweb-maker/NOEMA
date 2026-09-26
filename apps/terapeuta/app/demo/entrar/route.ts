/**
 * Entrada al sandbox: /demo/entrar?rol=psicologo|paciente&a=/ruta
 *
 * Si el visitante ya tiene sus dos sesiones vivas, solo lo manda a donde va.
 * Si no (primera vez, o el reinicio nocturno borró sus cuentas), crea una
 * pareja nueva de cuentas demo con su historia y abre ambas sesiones.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_DEMO, INICIO_ROL, type RolDemo } from '@/lib/demo/constantes';
import {
  borrarCookiesDemo,
  crearVisitanteYSesiones,
  estadoDemo,
  origenDe,
  sesionesVivas,
} from '@/lib/demo/servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function rutaSegura(a: string | null, rol: RolDemo): string {
  if (!a || !a.startsWith('/') || a.startsWith('//')) return INICIO_ROL[rol];
  return a;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rol: RolDemo = sp.get('rol') === 'paciente' ? 'paciente' : 'psicologo';
  const destino = rutaSegura(sp.get('a'), rol);
  const url = new URL(origenDe(req));
  const [ruta, query] = destino.split('?');
  url.pathname = ruta || INICIO_ROL[rol];
  url.search = query ? `?${query}` : '';
  const res = NextResponse.redirect(url, { status: 303 });

  const visitante = req.cookies.get(COOKIE_DEMO)?.value;
  if (visitante) {
    const [estado, vivas] = await Promise.all([estadoDemo(visitante), sesionesVivas(req, res)]);
    if (estado.ok && vivas) return res;
    borrarCookiesDemo(req, res);
  }

  const estado = await crearVisitanteYSesiones(req, res);
  if (!estado.ok) {
    const err = new URL(origenDe(req));
    err.pathname = '/demo';
    err.search = `?error=${encodeURIComponent(estado.error === 'demo_ocupado' ? 'ocupado' : 'no_disponible')}`;
    const r = NextResponse.redirect(err, { status: 303 });
    borrarCookiesDemo(req, r);
    return r;
  }
  return res;
}
