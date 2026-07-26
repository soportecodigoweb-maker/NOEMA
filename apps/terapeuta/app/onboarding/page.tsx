import { OnboardingForm } from './OnboardingForm';

/**
 * Onboarding: primera vez que un usuario entra (correo o Google). Aquí elige su
 * rol y completa los datos faltantes. El middleware fuerza esta pantalla a
 * cualquier usuario con rol 'sin_terapeuta'.
 */
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bone px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-noema-deep/10 bg-white/60 p-6 shadow-sm sm:p-8">
        <OnboardingForm />
      </div>
    </main>
  );
}
