/**
 * Despachador de avisos push web.
 *
 * Lo llaman (a) el trigger `trg_push_web_al_instante` de Postgres en cada
 * INSERT en `notificaciones` (vía pg_net, POST) y (b) el cron diario de
 * respaldo `push_web_respaldo_diario` (pg_cron). También sirve a mano con GET.
 *
 * Autoriza con `Authorization: Bearer <CRON_SECRET>` o `?clave=<CRON_SECRET>`.
 * Con service_role: push_pendientes(24) → enviarPush → marcar_push_enviada, y
 * borra las suscripciones que el navegador ya dio de baja (404/410).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { enviarPush, prepararPush } from '@/lib/push';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function autorizado(req: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET?.trim();
  if (!secreto) return false;
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const clave = req.nextUrl.searchParams.get('clave')?.trim();
  return bearer === secreto || clave === secreto;
}

async function despachar(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const prep = prepararPush();
  if (!prep.ok) {
    return NextResponse.json({ ok: false, error: prep.motivo }, { status: 500 });
  }

  const db = createServiceClient();
  const { data: pendientes, error } = await db.rpc('push_pendientes', { p_horas: 24 });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const filas = pendientes ?? [];
  let enviados = 0;
  let fallidos = 0;
  const muertas = new Set<string>();
  const errores: string[] = [];
  // Un aviso puede ir a varios dispositivos; se marca enviado si al menos
  // uno lo aceptó (o si todas sus suscripciones estaban muertas).
  const aceptados = new Set<string>();
  const vistos = new Set<string>();

  await Promise.all(
    filas.map(async (f) => {
      vistos.add(f.id);
      const r = await enviarPush(
        { endpoint: f.endpoint, p256dh: f.p256dh, auth: f.auth },
        { title: f.titulo, body: f.cuerpo, url: f.url, tag: `noema-${f.id}` },
      );
      if (r.ok) {
        enviados++;
        aceptados.add(f.id);
      } else {
        fallidos++;
        if (r.muerta) muertas.add(f.endpoint);
        else if (errores.length < 5) errores.push(r.error);
      }
    }),
  );

  let borradas = 0;
  if (muertas.size > 0) {
    const { count } = await db
      .from('push_suscripciones')
      .delete({ count: 'exact' })
      .in('endpoint', [...muertas]);
    borradas = count ?? 0;
  }

  // Marcar: los aceptados, y los que solo fallaron por suscripciones muertas
  // (ya no hay a dónde mandarlos; el cron no debe reintentarlos para siempre).
  const soloMuertas = [...vistos].filter(
    (id) =>
      !aceptados.has(id) &&
      filas.filter((f) => f.id === id).every((f) => muertas.has(f.endpoint)),
  );
  const marcar = [...aceptados, ...soloMuertas];
  if (marcar.length > 0) {
    await db.rpc('marcar_push_enviada', { p_ids: marcar });
  }

  return NextResponse.json({
    ok: true,
    avisos: vistos.size,
    enviados,
    fallidos,
    borradas,
    ...(errores.length > 0 ? { errores } : {}),
  });
}

export async function GET(req: NextRequest) {
  return despachar(req);
}

export async function POST(req: NextRequest) {
  return despachar(req);
}
