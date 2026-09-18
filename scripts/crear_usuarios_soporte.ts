/**
 * Cuentas de SOPORTE en producción para probar el panel de punta a punta
 * (avisos push, mensajes, etc.): un terapeuta verificado y un paciente
 * vinculado con él. Mismo patrón que seed_demo_data.ts / seed_paciente_demo.ts.
 *
 * Idempotente: si el usuario ya existe se reutiliza y solo se actualiza la
 * contraseña; profile/terapeutas/pacientes se hacen con upsert; la
 * vinculación se crea solo si no hay una entre los dos.
 *
 * Uso (contra producción, desde la laptop):
 *   SUPABASE_URL=https://api.somosnoema.com \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role del VPS> \
 *   NOEMA_PASSWORD=<contraseña de las dos cuentas> \
 *   pnpm tsx scripts/crear_usuarios_soporte.ts
 *
 * La contraseña NUNCA se imprime ni se guarda en archivos.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54621';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.NOEMA_PASSWORD;

if (!SERVICE_ROLE_KEY) {
  console.error('✗ Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}
if (!PASSWORD || PASSWORD.length < 8) {
  console.error('✗ NOEMA_PASSWORD no existe o tiene menos de 8 caracteres.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TERAPEUTA = {
  email: 'operana.oficial@gmail.com',
  nombre: 'Soporte NOEMA',
  ciudad: 'Ciudad de México',
  titulo: 'Lic. en Psicología',
  descripcion: 'Cuenta de soporte de NOEMA para pruebas del panel.',
};

const PACIENTE = {
  email: 'boomerangmexico25@gmail.com',
  nombre: 'Paciente Prueba',
  ciudad: 'Ciudad de México',
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Crea el usuario auth (el trigger handle_new_auth_user crea el profile) o reutiliza y actualiza la contraseña. */
async function asegurarUsuario(email: string, nombre: string, rol: 'terapeuta' | 'paciente'): Promise<string> {
  const { data: lista, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error(`listUsers: ${listErr.message}`);
  const existente = lista.users.find((u) => u.email?.toLowerCase() === email);

  if (existente) {
    const { error } = await admin.auth.admin.updateUserById(existente.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`updateUserById ${email}: ${error.message}`);
    console.log(`  ↳ ${email} ya existía (${existente.id}); contraseña actualizada`);
    return existente.id;
  }

  const { data: creado, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });
  if (error || !creado.user) throw new Error(`createUser ${email}: ${error?.message}`);
  console.log(`  ↳ ${email} creado (${creado.user.id})`);
  return creado.user.id;
}

async function main() {
  console.log('🛟 Cuentas de soporte en', SUPABASE_URL, '\n');

  // ── 1. Terapeuta ───────────────────────────────────────────────────────────
  console.log(`→ Terapeuta ${TERAPEUTA.nombre}`);
  const terapeutaId = await asegurarUsuario(TERAPEUTA.email, TERAPEUTA.nombre, 'terapeuta');

  const { error: perfilTErr } = await admin.from('profiles').upsert(
    {
      id: terapeutaId,
      email: TERAPEUTA.email,
      nombre: TERAPEUTA.nombre,
      rol: 'terapeuta',
      ciudad: TERAPEUTA.ciudad,
      onboarding_completo: true,
    },
    { onConflict: 'id' },
  );
  if (perfilTErr) throw new Error(`profile terapeuta: ${perfilTErr.message}`);

  const { error: terapeutaErr } = await admin.from('terapeutas').upsert(
    {
      profile_id: terapeutaId,
      titulo: TERAPEUTA.titulo,
      descripcion: TERAPEUTA.descripcion,
      estado_verificacion: 'verificado',
    },
    { onConflict: 'profile_id' },
  );
  if (terapeutaErr) throw new Error(`terapeutas: ${terapeutaErr.message}`);
  console.log('  ✓ profile + terapeutas (verificado)');

  // ── 2. Paciente ────────────────────────────────────────────────────────────
  console.log(`→ Paciente ${PACIENTE.nombre}`);
  const pacienteId = await asegurarUsuario(PACIENTE.email, PACIENTE.nombre, 'paciente');

  const { error: perfilPErr } = await admin.from('profiles').upsert(
    {
      id: pacienteId,
      email: PACIENTE.email,
      nombre: PACIENTE.nombre,
      rol: 'paciente',
      ciudad: PACIENTE.ciudad,
      onboarding_completo: true,
    },
    { onConflict: 'id' },
  );
  if (perfilPErr) throw new Error(`profile paciente: ${perfilPErr.message}`);

  const { error: pacienteErr } = await admin.from('pacientes').upsert(
    {
      profile_id: pacienteId,
      ocupacion: 'Pruebas de soporte',
      motivos_consulta: ['ansiedad'],
    },
    { onConflict: 'profile_id' },
  );
  if (pacienteErr) throw new Error(`pacientes: ${pacienteErr.message}`);
  console.log('  ✓ profile + pacientes');

  // ── 3. Vinculación activa ──────────────────────────────────────────────────
  const { data: vincExistente } = await admin
    .from('vinculaciones')
    .select('id, estado')
    .eq('terapeuta_id', terapeutaId)
    .eq('paciente_id', pacienteId)
    .maybeSingle();

  if (vincExistente) {
    if (vincExistente.estado !== 'activa') {
      const { error } = await admin
        .from('vinculaciones')
        .update({ estado: 'activa' })
        .eq('id', vincExistente.id);
      if (error) throw new Error(`vinculacion update: ${error.message}`);
    }
    console.log(`  ✓ vinculación existía (${vincExistente.id}) → activa`);
  } else {
    const { data: vinc, error: vErr } = await admin
      .from('vinculaciones')
      .insert({
        terapeuta_id: terapeutaId,
        paciente_id: pacienteId,
        nombre_invitado: PACIENTE.nombre,
        email_invitado: PACIENTE.email,
        estado: 'activa',
        fecha_inicio: daysAgo(1),
        consentimiento_aceptado_at: new Date(Date.now() - 86400000).toISOString(),
        version_consentimiento: '2026-05-v1',
        notificar_crisis_terapeuta: true,
        codigo_invitacion: '',
      })
      .select('id')
      .single();
    if (vErr || !vinc) throw new Error(`vinculacion insert: ${vErr?.message}`);
    console.log(`  ✓ vinculación creada (${vinc.id})`);
  }

  console.log('\n✓ Listo. Entra en el panel con esas dos cuentas (contraseña = NOEMA_PASSWORD).');
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e);
  process.exit(1);
});
