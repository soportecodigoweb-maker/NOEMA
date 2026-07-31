'use client';

import { useState, useTransition } from 'react';
import { FileSignature, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { firmarConsentimientoAction } from './actions';

interface Documento {
  id: string;
  titulo: string;
  contenido: string;
  enviado: string;
  firmado: string | null;
  firmaNombre: string | null;
}

export function DocumentosPaciente({ documentos: inicial }: { documentos: Documento[] }) {
  const [documentos, setDocumentos] = useState<Documento[]>(inicial);

  if (documentos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-white/60 p-6 text-sm text-ink/60">
        Tu terapeuta aún no te ha enviado documentos. Cuando lo haga, aparecerán aquí para que
        los leas y firmes.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {documentos.map((d) => (
        <DocItem
          key={d.id}
          doc={d}
          onFirmado={(nombre, fecha) =>
            setDocumentos((p) =>
              p.map((x) => (x.id === d.id ? { ...x, firmado: fecha, firmaNombre: nombre } : x)),
            )
          }
        />
      ))}
    </ul>
  );
}

function DocItem({
  doc,
  onFirmado,
}: {
  doc: Documento;
  onFirmado: (nombre: string, fecha: string) => void;
}) {
  const [abierto, setAbierto] = useState(!doc.firmado);
  const [nombre, setNombre] = useState('');
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const firmar = () => {
    setError(null);
    startTransition(async () => {
      const r = await firmarConsentimientoAction(doc.id, nombre);
      if (r.ok) {
        onFirmado(nombre.trim(), 'ahora');
      } else {
        setError(r.error ?? 'No se pudo firmar.');
      }
    });
  };

  return (
    <li className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <button
        onClick={() => setAbierto((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <FileSignature className="size-5 shrink-0 text-noema-sage" strokeWidth={1.7} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{doc.titulo}</span>
          {doc.firmado ? (
            <span className="text-xs text-noema-sage">
              Firmado{doc.firmaNombre ? ` por ${doc.firmaNombre}` : ''}
              {doc.firmado !== 'ahora' ? ` · ${doc.firmado}` : ''}
            </span>
          ) : (
            <span className="text-xs text-noema-clay">Pendiente de firma</span>
          )}
        </span>
        {abierto ? (
          <ChevronUp className="size-4 text-ink/40" />
        ) : (
          <ChevronDown className="size-4 text-ink/40" />
        )}
      </button>

      {abierto && (
        <div className="border-t border-ink/8 px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{doc.contenido}</p>

          {doc.firmado ? (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-noema-sage/10 px-3 py-2 text-sm text-noema-sage">
              <Check className="size-4" /> Firmado{doc.firmaNombre ? ` por ${doc.firmaNombre}` : ''}
            </p>
          ) : (
            <div className="mt-4 space-y-3 rounded-xl border border-noema-sage/25 bg-noema-sage/[0.05] p-4">
              <p className="text-sm font-medium text-ink">Firmar documento</p>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Escribe tu nombre completo"
                className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
              />
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/80">
                <input
                  type="checkbox"
                  checked={acepto}
                  onChange={(e) => setAcepto(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-noema-sage"
                />
                He leído este documento en su totalidad, lo comprendo y lo firmo de forma libre.
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
