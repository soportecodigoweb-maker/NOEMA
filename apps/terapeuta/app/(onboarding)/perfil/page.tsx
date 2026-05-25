import { PerfilForm } from './PerfilForm';

export const metadata = { title: 'Completa tu perfil' };

export default function PerfilOnboardingPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl text-ink leading-tight">
          Completemos tu perfil
        </h1>
        <p className="text-foreground-muted">
          Esto aparecerá en el directorio público cuando estés verificada/o.
          Puedes ajustarlo cuando quieras desde Ajustes.
        </p>
      </div>
      <PerfilForm />
    </div>
  );
}
