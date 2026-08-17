'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Send, Trash2, MessagesSquare } from 'lucide-react';
import {
  publicarAnuncioAction,
  eliminarAnuncioAction,
  enviarMensajeCentroAction,
} from '../../../app/centro/gestion-actions';

interface Anuncio {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: string;
}
interface Mensaje {
  id: string;
  cuerpo: string;
  deCentro: boolean;
  fecha: string;
}

const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function Anuncios({ inicial }: { inicial: Anuncio[] }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [, startTransition] = useTransition();

  const publicar = () => {
    if (!titulo.trim() || !cuerpo.trim()) return;
    startTransition(async () => {
      await publicarAnuncioAction(titulo, cuerpo);
      setTitulo('');
      setCuerpo('');
      router.refresh();
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
          <Megaphone className="size-5 text-noema-sage" /> Publicar anuncio
        </h2>
        <input className={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del anuncio" />
        <textarea
          className={`${input} mt-2 min-h-[100px]`}
          value={cuerpo}
          onChange={(e) => setCuerpo(e.target.value)}
          placeholder="Mensaje para todos los terapeutas del centro…"
        />
        <button
          onClick={publicar}
          disabled={!titulo.trim() || !cuerpo.trim()}
          className="mt-3 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          Publicar para todos
        </button>
      </div>

      {inicial.length > 0 && (
        <ul className="space-y-2">
          {inicial.map((a) => (
            <li key={a.id} className="rounded-xl border border-noema-deep/10 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{a.titulo}</p>
                  <p className="whitespace-pre-wrap text-sm text-ink/75">{a.cuerpo}</p>
                  <p className="mt-1 text-xs text-foreground-muted">{a.fecha}</p>
                </div>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await eliminarAnuncioAction(a.id);
                      router.refresh();
                    })
                  }
                  aria-label="Eliminar"
                  className="shrink-0 text-ink/30 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Conversaciones({
  terapeutas,
  mensajes,
  seleccionado,
}: {
  terapeutas: { id: string; nombre: string }[];
  mensajes: Mensaje[];
  seleccionado: string | null;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [, startTransition] = useTransition();

  const enviar = () => {
    if (!texto.trim() || !seleccionado) return;
    startTransition(async () => {
      await enviarMensajeCentroAction(seleccionado, texto);
      setTexto('');
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink">
        <MessagesSquare className="size-5 text-noema-sage" /> Mensajes con un terapeuta
      </h2>

      {terapeutas.length === 0 ? (
        <p className="text-sm text-foreground-muted">Aún no hay terapeutas vinculados.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {terapeutas.map((t) => (
              <a
                key={t.id}
                href={`/centro/comunicacion?t=${t.id}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  seleccionado === t.id
                    ? 'bg-noema-sage text-bone'
                    : 'bg-noema-deep/[0.06] text-ink/70 hover:bg-noema-deep/10'
                }`}
              >
                {t.nombre}
              </a>
            ))}
          </div>

          {seleccionado ? (
            <>
              <div className="mb-3 max-h-80 space-y-2 overflow-y-auto rounded-xl bg-paper/40 p-3">
                {mensajes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-foreground-muted">
                    Sin mensajes todavía. Escribe el primero.
                  </p>
                ) : (
                  mensajes.map((m) => (
                    <div key={m.id} className={`flex ${m.deCentro ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                          m.deCentro ? 'bg-noema-deep text-bone' : 'bg-white text-ink border border-noema-deep/10'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.cuerpo}</p>
                        <p className={`mt-0.5 text-[10px] ${m.deCentro ? 'text-bone/60' : 'text-foreground-muted'}`}>
                          {m.fecha}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  className={input}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviar()}
                  placeholder="Escribe un mensaje…"
                />
                <button
                  onClick={enviar}
                  disabled={!texto.trim()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                >
                  <Send className="size-4" /> Enviar
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-foreground-muted">Elige un terapeuta para ver la conversación.</p>
          )}
        </>
      )}
    </section>
  );
}
