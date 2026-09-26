import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Reproductor } from '@/components/demo/video/Reproductor';
import { COOKIE_DEMO, type RolDemo } from '@/lib/demo/constantes';
import { estadoDemo } from '@/lib/demo/servidor';
import { VIDEO_PSICOLOGO } from '@/lib/demo/video-psicologo';
import { VIDEO_PACIENTE } from '@/lib/demo/video-paciente';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ rol: string }>;
}

export function generateMetadata({ params }: PageProps) {
  return params.then(({ rol }) => ({
    title: rol === 'paciente' ? 'Video demo del paciente' : 'Video demo del psicólogo',
  }));
}

/**
 * Video demo: la app real corre dentro de los marcos con la sesión demo del
 * visitante, así que primero nos aseguramos de que exista (sin sesión lo
 * mandamos a crearla y regresa aquí).
 */
export default async function VideoDemoPage({ params }: PageProps) {
  const { rol: r } = await params;
  if (r !== 'psicologo' && r !== 'paciente') notFound();
  const rol = r as RolDemo;

  const visitante = (await cookies()).get(COOKIE_DEMO)?.value;
  const estado = visitante ? await estadoDemo(visitante) : null;
  if (!estado?.ok) {
    redirect(`/demo/entrar?rol=${rol}&a=${encodeURIComponent(`/demo/video/${rol}`)}`);
  }

  return (
    <Reproductor
      video={rol === 'psicologo' ? VIDEO_PSICOLOGO : VIDEO_PACIENTE}
      rol={rol}
      vinc={estado.vinculacion_id ?? null}
      volverA={`/demo/${rol}`}
    />
  );
}
