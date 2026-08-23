'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileSignature, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { firmarAcuerdoCentroAction } from '../../../app/(panel)/mi-centro/acuerdo-actions';

export interface AcuerdoCentro {
  id: string;
  titulo: string;
  contenido: string;
  enviado: string;
  firmado: string | null;
  firmaNombre: string | null;
}

/** Formatos y acuerdos que el centro envió al terapeuta para firmar. */
export function AcuerdosPorFirmar({ acuerdos }: { acuerdos: AcuerdoCentro[] }) {
  if (acuerdos.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-muted">
        <FileSignature className="size-3.5" /> Documentos de tu centro
      </h2>
      <ul className="space-y-2">
        {acuerdos.map((a) => (
          <Item key={a.id} a={a} />
        ))}
      </ul>
    </section>
  );
}

function Item({ a }: { a: AcuerdoCentro }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(!a.firmado);
  const [nombre, setNombre] = useState('');
  const [acepto, setAcepto] = useState(false);
  const [firmado, setFirmado] = useState(a.firmado);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const firmar = () => {
    setError(null);
    startTransition(async () => {
      const r = await firmarAcuerdoCentroAction(a.id, nombre);
      if (r.ok) {
        setFirmado('ahora');
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo firmar.');
      }
    });
  };

  return (
    <li className="overflow-hidden rounded-2xl border border-noema-deep/10 bg-white">
      <button onClick={() => setAbierto((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <FileSignature className="size-5 shrink-0 text-noema-sage" strokeWidth={1.7} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{a.titulo}</span>
          {firmado ? (
            <span className="text-xs text-noema-sage">
              Firmado{a.firmaNombre ? ` por ${a.firmaNombre}` : ''}
            </span>
          ) : (
            <span className="text-xs text-noema-clay">Pendiente de firma · {a.enviado}</span>
          )}
        </span>
        {abierto ? (
          <ChevronUp className="size-4 text-ink/40" />
        ) : (
          <ChevronDown className="size-4 text-ink/40" />
        )}
      </button>

      {abierto && (
        <div className="border-t border-noema-deep/[0.08] px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{a.contenido}</p>

          {firmado ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-noema-sage/10 px-3 py-2 text-sm text-noema-sage">
              <Check className="size-4" /> Documento firmado
            </p>
          ) : (
            <div className="mt-3 space-y-2 rounded-xl border border-noema-sage/25 bg-noema-sage/[0.05] p-3">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Escribe tu nombre completo"
                className="w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
              />
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/85">
                <input
                  type="checkbox"
                  checked={acepto}
                  onChange={(e) => setAcepto(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-noema-sage"
                />
                He leído este documento y lo firmo de forma libre.
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={firmar}
                disabled={pending || !acepto || !nombre.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
              >
                <Check className="size-4" /> {pending ? 'Firmando…' : 'Firmar'}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
