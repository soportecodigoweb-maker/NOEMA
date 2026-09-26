/** Salir del demo: cierra las dos sesiones demo y vuelve al login. */
import { NextResponse, type NextRequest } from 'next/server';
import { borrarCookiesDemo, origenDe } from '@/lib/demo/servidor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(origenDe(req));
  url.pathname = req.nextUrl.searchParams.get('a') === 'web' ? '/web' : '/signin';
  url.search = '';
  const res = NextResponse.redirect(url, { status: 303 });
  borrarCookiesDemo(req, res);
  return res;
}
