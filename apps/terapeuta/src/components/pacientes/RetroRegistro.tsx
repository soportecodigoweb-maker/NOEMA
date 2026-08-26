'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Check, Pencil, X } from 'lucide-react';
import { retroalimentarRegistroAction } from '../../../app/(panel)/pacientes/[id]/registros/actions';

/** Deja o edita la retroalimentación del terapeuta a un registro emocional. */
export function RetroRegistro({
  registroId,
  vinculacionId,
  inicial,
  fecha,
  abrirInicial = false,
}: {
  registroId: string;
  vinculacionId: string;
  inicial: string | null;
  fecha: string | null;
  /** Si llega desde la notificación de este registro, abre el recuadro solo. */
  abrirInicial?: boolean;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(inicial ?? '');
  const [guardado, setGuardado] = useState(inicial);
  // Colapsado por defecto; se abre con el botón "Responder" (o desde la notif).
  const [editando, setEditando] = useState(abrirInicial && !inicial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Si llega desde la notificación, lleva la vista a este registro.
  useEffect(() => {
    if (abrirInicial) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviar = () => {
    setError(null);
    startTransition(async () => {
      const r = await retroalimentarRegistroAction(registroId, vinculacionId, valor);
      if (r.ok) {
        setGuardado(valor.trim() || null);
        setEditando(false);
        router.refresh();
      } else {
        setError(r.error ?? 'No se pudo guardar.');
      }
    });
  };

  // Vista: ya hay retroalimentación y no está editando.
  if (guardado && !editando) {
    return (
      <div className="mt-3 rounded-lg border-l-2 border-noema-sage bg-noema-sage/[0.06] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-noema-sage">
            <MessageCircle className="size-3" /> Tu mensaje al paciente
          </p>
          <button
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-1 text-[11px] text-ink/50 hover:text-ink"
          >
            <Pencil className="size-3" /> Editar
          </button>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink/90">{guardado}</p>
        {fecha && <p className="mt-0.5 text-[10px] text-ink/40">Enviado {fecha}</p>}
      </div>
    );
  }

  // Sin comentario y colapsado: botón para abrir el recuadro.
  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-noema-sage/40 bg-noema-sage/[0.06] px-3 py-1.5 text-sm font-medium text-noema-sage hover:bg-noema-sage/15"
      >
        <MessageCircle className="size-4" /> Comentar esta emoción
      </button>
    );
  }

  // Editor.
  return (
    <div ref={ref} className="mt-3 rounded-lg border border-noema-sage/25 bg-noema-sage/[0.04] p-3">
      <p className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-noema-sage">
        <MessageCircle className="size-3" /> Responder a este registro
      </p>
      <textarea
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        rows={2}
        placeholder="Un mensaje de apoyo, una observación o una indicación para tu paciente…"
        className="w-full resize-y rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm text-ink focus:border-noema-sage focus:outline-none"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={enviar}
          disabled={pending || !valor.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          <Check className="size-4" /> {pending ? 'Enviando…' : 'Enviar al paciente'}
        </button>
        <button
          onClick={() => {
            setValor(guardado ?? '');
            setEditando(false);
            setError(null);
          }}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-ink/50 hover:text-ink"
        >
          <X className="size-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}
