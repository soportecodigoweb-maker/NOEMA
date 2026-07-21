import Link from 'next/link';
import { SignInForm } from './SignInForm';

export const metadata = { title: 'Inicia sesión' };

interface PageProps {
  searchParams: Promise<{ type?: string; rol?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const wrongRole = params.type === 'wrong-role';
  const rol = params.rol;

  const subtitulo =
    rol === 'paciente'
      ? 'Entra a tu proceso: registros, diario, tareas y más.'
      : rol === 'terapeuta'
        ? 'Continúa el seguimiento de tus pacientes.'
        : 'Entra a NOEMA. Detectamos tu rol automáticamente.';

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl text-ink leading-tight">
          {rol === 'paciente' ? 'Acceso paciente' : rol === 'terapeuta' ? 'Acceso terapeuta' : 'Inicia sesión'}
        </h1>
        <p className="text-foreground-muted">{subtitulo}</p>
      </div>

      {wrongRole && (
        <div className="rounded-md border border-emotion-ansioso/40 bg-emotion-ansioso/15 p-4">
          <p className="text-sm text-ink font-medium mb-1">
            Esta cuenta es de paciente
          </p>
          <p className="text-sm text-foreground-muted leading-relaxed">
            El panel web es solo para terapeutas. Si eres paciente, descarga la
            app NOEMA en tu celular para acceder a tu proceso.
          </p>
        </div>
      )}

      <SignInForm />

      <p className="text-sm text-foreground-muted text-center">
        ¿Aún no tienes cuenta?{' '}
        <Link
          href="/signup"
          className="text-noema-sage font-medium underline-offset-4 hover:underline"
        >
          Crea una
        </Link>
      </p>
    </div>
  );
}
