'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Check, KeyRound } from 'lucide-react';
import { invitarTerapeutaAction } from '../../../app/centro/supervision-actions';

export function InvitarTerapeuta({ codigo }: { codigo: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const invitar = () => {
    setError(null);
    setAviso(null);
    startTransition(async () => {
      const r = await invitarTerapeutaAction(email);
      if (r.ok) {
        setAviso(r.aviso ?? 'Invitación enviada.');
        setEmail('');
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo invitar.');
      }
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
        <UserPlus className="size-5 text-noema-sage" /> Invitar terapeuta
      </h2>
      <p className="mb-3 text-sm text-foreground-muted">
        Escribe el correo con el que se registró en NOEMA. Recibirá una invitación y, al aceptarla,
        formará parte de tu centro.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && invitar()}
          placeholder="terapeuta@correo.com"
          className="flex-1 rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
        />
        <button
          onClick={invitar}
          disabled={pending || !email.trim()}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Enviando…' : 'Enviar invitación'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {aviso && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-noema-sage">
          <Check className="size-4" /> {aviso}
        </p>
      )}

      {codigo && (
        <p className="mt-3 flex flex-wrap items-center gap-2 border-t border-noema-deep/[0.06] pt-3 text-xs text-foreground-muted">
          <KeyRound className="size-3.5 text-noema-sage" />
          O comparte el código de tu centro para que se unan ellos mismos:
          <span className="rounded border border-noema-deep/15 bg-paper/60 px-2 py-0.5 font-mono text-ink">
            {codigo}
          </span>
        </p>
      )}
    </section>
  );
}
