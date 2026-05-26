import Link from 'next/link';
import { SignInForm } from './SignInForm';

export const metadata = { title: 'Inicia sesión' };

export default function SignInPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl text-ink leading-tight">
          Inicia sesión
        </h1>
        <p className="text-foreground-muted">
          Continúa el seguimiento de tus pacientes.
        </p>
      </div>

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
