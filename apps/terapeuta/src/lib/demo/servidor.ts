/**
 * Lado servidor del demo: crear visitantes, abrir sus dos sesiones, leer su
 * estado. Solo se usa en rutas /demo/* (Route Handlers) y en los layouts.
 */
import { createHash, randomBytes } from 'node:crypto';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@noema/database';
import { createServiceClient } from '@/lib/supabase/service';
import {
  COOKIE_DEMO,
  COOKIE_DEMO_UI,
  DEMO_MAX_AGE_SEG,
  STORAGE_KEY_AUTH,
  STORAGE_KEY_DEMO_PACIENTE,
} from './constantes';

export interface EstadoDemo {
  ok: boolean;
  error?: string;
  visitante?: string;
  terapeuta_id?: string;
  paciente_id?: string;
  vinculacion_id?: string;
  email_psicologo?: string;
  email_paciente?: string;
  creado_at?: string;
  reiniciado_at?: string | null;
}

/** Estado del visitante (vía service_role; la tabla no tiene políticas). */
export async function estadoDemo(visitante: string): Promise<EstadoDemo> {
  const db = createServiceClient();
  const { data, error } = await db.rpc('demo_estado', { p_visitante: visitante });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false }) as unknown as EstadoDemo;
}

/** Cliente de sesión que lee cookies de la petición y las escribe en la respuesta. */
export function clienteSesion(storageKey: string, req: NextRequest, res: NextResponse) {
  const url = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createServerClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { storageKey, flowType: 'pkce' },
    cookieOptions: { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, { ...options, path: '/' }),
        );
      },
    },
  });
}

/** Borra en la respuesta todas las cookies de sesión (ambas claves) y las del demo. */
export function borrarCookiesDemo(req: NextRequest, res: NextResponse) {
  for (const c of req.cookies.getAll()) {
    if (c.name.startsWith(STORAGE_KEY_AUTH) || c.name.startsWith(STORAGE_KEY_DEMO_PACIENTE)) {
      res.cookies.set(c.name, '', { path: '/', maxAge: 0 });
    }
  }
  res.cookies.set(COOKIE_DEMO, '', { path: '/', maxAge: 0 });
  res.cookies.set(COOKIE_DEMO_UI, '', { path: '/', maxAge: 0 });
}

export function fijarCookiesDemo(res: NextResponse, visitante: string) {
  const base = {
    path: '/',
    sameSite: 'lax' as const,
    maxAge: DEMO_MAX_AGE_SEG,
    secure: process.env.NODE_ENV === 'production',
  };
  res.cookies.set(COOKIE_DEMO, visitante, { ...base, httpOnly: true });
  res.cookies.set(COOKIE_DEMO_UI, '1', { ...base, httpOnly: false });
}

/** Origen público real de la petición (detrás de Traefik llega en x-forwarded-*). */
export function origenDe(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
}

/** Huella anónima de la IP (solo para frenar abusos; no identifica). */
export function huellaIp(req: NextRequest): string | null {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim();
  if (!ip) return null;
  return createHash('sha256')
    .update(ip + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''))
    .digest('hex')
    .slice(0, 24);
}

/**
 * Crea un visitante nuevo (pareja de cuentas + historia) y abre sus dos
 * sesiones escribiendo las cookies en `res`. Devuelve el estado o el error.
 */
export async function crearVisitanteYSesiones(
  req: NextRequest,
  res: NextResponse,
): Promise<EstadoDemo> {
  const visitante = crypto.randomUUID();
  // Contraseña efímera: solo existe durante esta petición. Nunca se guarda.
  const password = randomBytes(24).toString('base64url');
  const db = createServiceClient();
  const { data, error } = await db.rpc('demo_crear_visitante', {
    p_visitante: visitante,
    p_password: password,
    p_ip_hash: huellaIp(req),
  });
  if (error) return { ok: false, error: error.message };
  const estado = (data ?? { ok: false }) as unknown as EstadoDemo;
  if (!estado.ok || !estado.email_psicologo || !estado.email_paciente) return estado;

  const psic = clienteSesion(STORAGE_KEY_AUTH, req, res);
  const pac = clienteSesion(STORAGE_KEY_DEMO_PACIENTE, req, res);
  const [a, b] = await Promise.all([
    psic.auth.signInWithPassword({ email: estado.email_psicologo, password }),
    pac.auth.signInWithPassword({ email: estado.email_paciente, password }),
  ]);
  if (a.error) return { ok: false, error: `sesion_psicologo: ${a.error.message}` };
  if (b.error) return { ok: false, error: `sesion_paciente: ${b.error.message}` };

  fijarCookiesDemo(res, visitante);
  return estado;
}

/** ¿Las dos sesiones del visitante siguen vivas? */
export async function sesionesVivas(req: NextRequest, res: NextResponse): Promise<boolean> {
  const psic = clienteSesion(STORAGE_KEY_AUTH, req, res);
  const pac = clienteSesion(STORAGE_KEY_DEMO_PACIENTE, req, res);
  const [a, b] = await Promise.all([psic.auth.getUser(), pac.auth.getUser()]);
  return !!a.data.user && !!b.data.user;
}
