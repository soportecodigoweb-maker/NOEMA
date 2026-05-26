/**
 * Seed de datos demo NOEMA — terapeutas verificados para el directorio público.
 *
 * Crea 5 terapeutas con perfiles realistas, cuentas auth confirmadas y
 * estado_verificacion = 'verificado' para que aparezcan en /terapeutas.
 *
 * Uso:
 *   pnpm tsx scripts/seed_demo_data.ts
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54621';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface TerapeutaDemo {
  email: string;
  nombre: string;
  ciudad: string;
  titulo: string;
  cedula: string;
  descripcion: string;
  especialidades: string[];
  enfoques: string[];
  modalidades: Array<'online' | 'presencial' | 'hibrida'>;
}

const terapeutas: TerapeutaDemo[] = [
  {
    email: 'andrea.ruiz@demo.noema.app',
    nombre: 'Dra. Andrea Ruiz',
    ciudad: 'Ciudad de México',
    titulo: 'Mtra. en Psicoterapia Gestalt',
    cedula: '12345678',
    descripcion:
      'Acompaño a adultos en procesos de ansiedad, autoestima y relaciones desde un enfoque gestalt y humanista. Mi trabajo se basa en crear un espacio donde puedas reconocer lo que sientes sin juicio.\n\nHe acompañado a más de 200 personas en los últimos 8 años, con énfasis en procesos largos donde el cambio se asienta de verdad.',
    especialidades: ['Ansiedad', 'Autoestima', 'Relaciones de pareja', 'Duelo'],
    enfoques: ['Gestalt', 'Humanista', 'Mindfulness'],
    modalidades: ['online', 'presencial'],
  },
  {
    email: 'mario.lopez@demo.noema.app',
    nombre: 'Lic. Mario López',
    ciudad: 'Guadalajara',
    titulo: 'Lic. en Psicología Clínica',
    cedula: '23456789',
    descripcion:
      'Terapia cognitivo-conductual con foco en trastornos de ansiedad, depresión y manejo del estrés laboral. Mi enfoque es estructurado, breve y orientado a objetivos claros.\n\nTrabajo principalmente con adultos jóvenes y profesionistas que buscan herramientas concretas para sus retos cotidianos.',
    especialidades: ['Ansiedad', 'Depresión', 'Estrés laboral', 'Burnout'],
    enfoques: ['Cognitivo-conductual', 'TCC', 'Terapia breve'],
    modalidades: ['online', 'hibrida'],
  },
  {
    email: 'sofia.mendoza@demo.noema.app',
    nombre: 'Mtra. Sofía Mendoza',
    ciudad: 'Monterrey',
    titulo: 'Mtra. en Terapia Sistémica',
    cedula: '34567890',
    descripcion:
      'Terapia familiar, de pareja y procesos de cambio de etapa de vida (separación, parentalidad, transiciones laborales). Mi enfoque sistémico mira la red de relaciones que sostiene cada experiencia.\n\nCreo en sesiones espaciadas, profundas y con tareas concretas que se trabajan entre encuentros.',
    especialidades: ['Terapia de pareja', 'Terapia familiar', 'Parentalidad'],
    enfoques: ['Sistémica', 'Narrativa', 'Constructivista'],
    modalidades: ['online', 'presencial', 'hibrida'],
  },
  {
    email: 'pablo.herrera@demo.noema.app',
    nombre: 'Dr. Pablo Herrera',
    ciudad: 'Ciudad de México',
    titulo: 'Dr. en Psicología, Especialista en Trauma',
    cedula: '45678901',
    descripcion:
      'Trabajo con personas que han vivido experiencias traumáticas: duelo complejo, violencia, accidentes, abusos. Uso EMDR y enfoques somáticos para procesar lo que el cuerpo guarda.\n\nMi proceso respeta tu ritmo: nunca empujamos antes de tiempo, siempre construimos seguridad primero.',
    especialidades: ['Trauma', 'EMDR', 'Duelo complejo', 'PTSD'],
    enfoques: ['EMDR', 'Somatic Experiencing', 'Psicodinámica'],
    modalidades: ['presencial', 'hibrida'],
  },
  {
    email: 'lucia.fernandez@demo.noema.app',
    nombre: 'Lic. Lucía Fernández',
    ciudad: 'Puebla',
    titulo: 'Lic. en Psicología, Especialista en Adolescentes',
    cedula: '56789012',
    descripcion:
      'Terapia con adolescentes y adultos jóvenes (15-25 años). Especializada en identidad, vínculos, redes sociales, ansiedad académica y consumo. Trabajo siempre en alianza con la familia cuando es necesario, respetando la confidencialidad del adolescente.\n\nMi enfoque combina terapia narrativa con herramientas DBT.',
    especialidades: [
      'Adolescentes',
      'Identidad',
      'Consumo',
      'Ansiedad académica',
    ],
    enfoques: ['Narrativa', 'DBT', 'Sistémica'],
    modalidades: ['online', 'presencial'],
  },
];

async function main() {
  console.log('🌱 Sembrando terapeutas demo en', SUPABASE_URL);
  console.log('');

  for (const t of terapeutas) {
    console.log(`→ ${t.nombre}`);

    // 1. Crear o reciclar el user auth
    const { data: existingList } = await admin.auth.admin.listUsers();
    const existing = existingList?.users.find((u) => u.email === t.email);

    let userId: string;
    if (existing) {
      userId = existing.id;
      console.log(`  ↳ usuario auth ya existía (${userId})`);
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: t.email,
        password: 'demo-noema-2026',
        email_confirm: true,
        user_metadata: { nombre: t.nombre, rol: 'terapeuta' },
      });
      if (createErr || !created.user) {
        console.error(`  ✗ no se pudo crear auth user:`, createErr?.message);
        continue;
      }
      userId = created.user.id;
      console.log(`  ↳ usuario auth creado (${userId})`);
    }

    // 2. Upsert profile
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: t.email,
          nombre: t.nombre,
          rol: 'terapeuta',
          ciudad: t.ciudad,
          onboarding_completo: true,
        },
        { onConflict: 'id' },
      );
    if (profileErr) {
      console.error(`  ✗ profile error:`, profileErr.message);
      continue;
    }

    // 3. Upsert terapeuta + verificado
    const { error: terapeutaErr } = await admin
      .from('terapeutas')
      .upsert(
        {
          profile_id: userId,
          titulo: t.titulo,
          descripcion: t.descripcion,
          cedula_profesional: t.cedula,
          especialidades: t.especialidades,
          enfoques: t.enfoques,
          modalidades: t.modalidades,
          estado_verificacion: 'verificado',
        },
        { onConflict: 'profile_id' },
      );
    if (terapeutaErr) {
      console.error(`  ✗ terapeuta error:`, terapeutaErr.message);
      continue;
    }

    console.log(`  ✓ sembrado`);
  }

  console.log('');
  console.log('✓ Listo. Refresca http://localhost:3006/terapeutas para verlos.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
