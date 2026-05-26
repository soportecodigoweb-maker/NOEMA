import Link from 'next/link';
import { SignUpForm } from './SignUpForm';

export const metadata = { title: 'Crea tu cuenta' };

export default function SignUpPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl text-ink leading-tight">
          Crea tu cuenta
        </h1>
        <p className="text-foreground-muted">
          Comienza tu prueba premium de 30 días con pacientes ilimitados.
        </p>
      </div>

      <SignUpForm />

      <p className="text-sm text-foreground-muted text-center">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/signin"
          className="text-noema-sage font-medium underline-offset-4 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>

      <p className="text-xs text-foreground-muted text-center leading-relaxed">
        Al crear tu cuenta aceptas los términos de servicio y aviso de
        privacidad de NOEMA.
      </p>
    </div>
  );
}
