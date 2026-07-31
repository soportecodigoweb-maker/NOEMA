'use client';

import { useState, useTransition } from 'react';
import { FileSignature, Send, Trash2, Check, Clock } from 'lucide-react';
import { enviarConsentimientoAction, eliminarConsentimientoAction } from './actions';

interface Documento {
  id: string;
  titulo: string;
  enviado: string;
  firmado: string | null;
  firmaNombre: string | null;
}

interface Props {
  vinculacionId: string;
  plantilla: string;
  documentos: Documento[];
}

const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function Documentos({ vinculacionId, plantilla, documentos: inicial }: Props) {
  const [documentos, setDocumentos] = useState<Documento[]>(inicial);
  const [titulo, setTitulo] = useState('Consentimiento informado');
  const [contenido, setContenido] = useState(plantilla);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const enviar = () => {
    setError(null);
    startTransition(async () => {
      const r = await enviarConsentimientoAction(vinculacionId, titulo, contenido);
      if (r.ok) {
        setEnviado(true);
        setTimeout(() => setEnviado(false), 3000);
      } else {
        setError(r.error ?? 'No se pudo enviar.');
      }
    });
  };

  const borrar = (id: string) => {
    setDocumentos((p) => p.filter((d) => d.id !== id));
    startTransition(() => {
      eliminarConsentimientoAction(id, vinculacionId);
    });
  };

  return (
    <div className="space-y-8">
      {/* Enviar nuevo consentimiento */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h3 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
          <FileSignature className="size-5 text-noema-sage" /> Enviar consentimiento informado
        </h3>
        <p className="mb-3 text-sm text-foreground-muted">
          El paciente lo verá en su app, podrá leerlo y firmarlo. Puedes editar el texto.
        </p>
        <input
          className={`${input} mb-2`}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título del documento"
        />
        <textarea
          className={`${input} min-h-[220px] leading-relaxed`}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={enviar}
            disabled={!titulo.trim() || !contenido.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            <Send className="size-4" /> Enviar al paciente
          </button>
          {enviado && (
            <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
              <Check className="size-4" /> Enviado
            </span>
          )}
        </div>
      </section>

      {/* Documentos enviados */}
      <section>
        <h3 className="mb-3 font-serif text-lg text-ink">Documentos enviados</h3>
        {documentos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-noema-deep/15 bg-white/60 p-6 text-sm text-foreground-muted">
            Aún no has enviado consentimientos a este paciente.
          </p>
        ) : (
          <ul className="space-y-2">
            {documentos.map((d) => (
              <li
                key={d.id}
                className="flex items-start gap-3 rounded-xl border border-noema-deep/10 bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{d.titulo}</p>
                  <p className="text-xs text-foreground-muted">Enviado el {d.enviado}</p>
                  {d.firmado ? (
                    <p className="mt-1 inline-flex items-center gap-1 rounded bg-noema-sage/10 px-2 py-0.5 text-[11px] text-noema-sage">
                      <Check className="size-3" /> Firmado por {d.firmaNombre} · {d.firmado}
                    </p>
                  ) : (
                    <p className="mt-1 inline-flex items-center gap-1 rounded bg-noema-clay/10 px-2 py-0.5 text-[11px] text-noema-clay">
                      <Clock className="size-3" /> Pendiente de firma
                    </p>
                  )}
                </div>
                <button
                  onClick={() => borrar(d.id)}
                  aria-label="Eliminar"
                  className="shrink-0 text-ink/30 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
