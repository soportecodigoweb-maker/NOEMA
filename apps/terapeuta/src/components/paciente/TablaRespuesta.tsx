'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Send, Check } from 'lucide-react';
import { responderTareaAction } from '../../../app/paciente/actions';

export interface Columna {
  key: string;
  label: string;
}

/**
 * Respuesta en formato TABLA (auto-registros). El terapeuta definió las
 * columnas; el paciente agrega tantas filas como necesite y escribe en cada una.
 */
export function TablaRespuesta({
  tareaId,
  columnas,
  filasPrevias,
}: {
  tareaId: string;
  columnas: Columna[];
  filasPrevias?: string[][] | null;
}) {
  const router = useRouter();
  const yaRespondio = !!filasPrevias && filasPrevias.length > 0;
  const [filas, setFilas] = useState<string[][]>(
    yaRespondio ? filasPrevias! : [columnas.map(() => ''), columnas.map(() => '')],
  );
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const soloLectura = yaRespondio || enviado;

  const editar = (f: number, c: number, v: string) =>
    setFilas((prev) => prev.map((fila, i) => (i === f ? fila.map((x, k) => (k === c ? v : x)) : fila)));

  const agregarFila = () => setFilas((prev) => [...prev, columnas.map(() => '')]);
  const quitarFila = (i: number) => setFilas((prev) => (prev.length > 1 ? prev.filter((_, k) => k !== i) : prev));

  const enviar = () => {
    const conContenido = filas.filter((f) => f.some((c) => c.trim()));
    if (conContenido.length === 0) {
      setError('Escribe al menos una fila antes de enviar.');
      return;
    }
    setError(null);
    startTransition(async () => {
      // La tabla se guarda serializada en `respuestas` (una clave por columna
      // no serviría: hay varias filas).
      const r = await responderTareaAction(
        tareaId,
        { tabla: JSON.stringify({ columnas: columnas.map((c) => c.label), filas: conContenido }) },
        '',
        0,
        true,
      );
      if (r.ok) {
        setEnviado(true);
        router.refresh();
      } else {
        setError('No se pudo enviar. Intenta de nuevo.');
      }
    });
  };

  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] uppercase tracking-wider text-noema-deep/60">
        {soloLectura ? 'Tu respuesta' : 'Completa la tabla'}
      </p>

      <div className="overflow-x-auto rounded-lg border border-ink/10">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="bg-paper/60">
              {columnas.map((c) => (
                <th key={c.key} className="border-b border-ink/10 px-3 py-2 text-left text-xs font-medium text-ink/70">
                  {c.label}
                </th>
              ))}
              {!soloLectura && <th className="w-10 border-b border-ink/10" />}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i} className="border-b border-ink/[0.06] last:border-0">
                {columnas.map((c, k) => (
                  <td key={c.key} className="align-top">
                    {soloLectura ? (
                      <p className="whitespace-pre-wrap px-3 py-2 text-ink/85">{fila[k] || '—'}</p>
                    ) : (
                      <textarea
                        value={fila[k] ?? ''}
                        onChange={(e) => editar(i, k, e.target.value)}
                        rows={2}
                        placeholder={c.label}
                        className="w-full resize-y border-0 bg-transparent px-3 py-2 text-sm focus:bg-noema-sage/[0.04] focus:outline-none"
                      />
                    )}
                  </td>
                ))}
                {!soloLectura && (
                  <td className="px-1 align-top">
                    <button
                      onClick={() => quitarFila(i)}
                      disabled={filas.length <= 1}
                      aria-label="Quitar fila"
                      className="mt-2 text-ink/25 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!soloLectura && (
        <>
          <button
            onClick={agregarFila}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink hover:border-noema-sage/40"
          >
            <Plus className="size-3.5" /> Agregar fila
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={enviar}
            disabled={pending}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            <Send className="size-4" /> {pending ? 'Enviando…' : 'Enviar a mi terapeuta'}
          </button>
        </>
      )}

      {soloLectura && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-noema-sage">
          <Check className="size-4" /> Enviada a tu terapeuta
        </p>
      )}
    </div>
  );
}
