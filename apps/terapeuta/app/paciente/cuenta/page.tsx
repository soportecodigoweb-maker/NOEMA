import { ZonaCuenta } from '@/components/cuenta/ZonaCuenta';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi cuenta' };

export default function CuentaPacientePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <h1 className="font-serif text-3xl text-ink">Mi cuenta</h1>
      <p className="mt-1 text-sm text-ink/60">
        Cierra sesión o elimina tu cuenta cuando lo necesites.
      </p>
      <div className="mt-6">
        <ZonaCuenta />
      </div>
    </div>
  );
}
